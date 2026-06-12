# Code Review — expired_policies.py

## Resumen ejecutivo

El código tiene **tres problemas reales de producción**, en orden de severidad. Ninguno es cosmético.

---

## Problema 1 — Sin manejo de errores ni cierre de conexión (función completa)

**Dónde**: toda la función `list_expired_policies`

**Qué está mal**: La conexión a SQLite se abre pero nunca se cierra si el código falla. No hay `try/except/finally` ni uso de context manager (`with`). Si cualquier consulta lanza una excepción, la conexión queda abierta.

**Por qué importa en producción**: SQLite tiene un límite de conexiones concurrentes de escritura (es un archivo con lock). Con 500 asesores activos haciendo requests simultáneos, las conexiones huérfanas pueden agotar el límite y empezar a retornar errores 500 aleatorios. En el modelo de threading de Flask (o con gunicorn multi-worker), esto escala mal rápido.

**Qué comportamiento de negocio se rompe**: María llega el lunes —su día más crítico de gestión— y la app le devuelve 500. No puede ver sus pólizas vencidas. Pierde tiempo llamando a soporte en lugar de llamar a clientes.

**Cómo lo arreglaría**:

```python
def list_expired_policies(advisor_id):
    conn = sqlite3.connect(DB)
    try:
        cursor = conn.cursor()
        # ... lógica ...
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()  # siempre se ejecuta
```

Una mejora importante sería reemplazar el acceso directo a SQLite mediante consultas manuales por un ORM como SQLAlchemy, que proporciona una capa de abstracción sobre la base de datos, mejora la mantenibilidad del código y permite gestionar las conexiones de forma más eficiente mediante mecanismos como el connection pooling.

Adicionalmente, implementaría un sistema centralizado de manejo de excepciones mediante un error handler global. Esto evitaría que los errores se propaguen sin control, permitiría estandarizar las respuestas de error de la API y facilitaría el monitoreo y diagnóstico de fallos. De esta forma, cualquier excepción de negocio, validación o persistencia podría ser interceptada y transformada en una respuesta consistente para el cliente, mejorando tanto la experiencia de usuario como la mantenibilidad de la aplicación.

---

## Problema 2 — N+1 queries dentro del loop (líneas ~26–40)

**Dónde**: el `for policy in expired:` hace **2 queries adicionales por cada póliza**:
- `SELECT name, phone FROM clients WHERE id = ?`
- `SELECT COUNT(*) FROM contact_attempts WHERE policy_id = ?`

**Qué está mal**: Si María tiene 80 pólizas vencidas, este endpoint ejecuta **1 + 80×2 = 161 queries** en una sola request. Las queries dentro del loop no son visibles en el código a primera vista, que es exactamente por qué son peligrosas.

**Por qué importa en producción**: Con 500 asesores haciendo requests al mismo tiempo durante la hora pico del lunes, el servidor de base de datos recibe miles de queries por segundo para lo que debería ser una sola. La latencia del endpoint sube de ~50ms a varios segundos. SQLite con writes concurrentes se serializa y el problema se amplifica.

**Qué comportamiento de negocio se rompe**: La pantalla de gestión de María carga lento. Si tiene 200 pólizas vencidas, tarda varios segundos. Con el tiempo presionando (ella tiene que llamar a 20 clientes hoy), esa lentitud tiene costo real.

**Cómo lo arreglaría**: Un solo `JOIN` que traiga todo en una query:

```sql
SELECT 
    p.id, p.client_id, p.insurer, p.expiration_date, p.status,
    c.name AS client_name, c.phone AS client_phone,
    COUNT(ca.id) AS contact_attempts
FROM policies p
JOIN clients c ON c.id = p.client_id
LEFT JOIN contact_attempts ca ON ca.policy_id = p.id
WHERE p.advisor_id = ? AND p.expiration_date < ?
GROUP BY p.id
```

Una alternativa inmediata sería reemplazar las consultas dentro del bucle por una única consulta utilizando JOINs, reduciendo el número de accesos a la base de datos independientemente de la cantidad de pólizas recuperadas.

Adicionalmente, consideraría implementar esta lógica mediante un ORM (por ejemplo, SQLAlchemy), aprovechando mecanismos como relaciones, eager loading y optimización de consultas para evitar el problema de N+1 queries de forma más mantenible.

Sin embargo, no asumiría automáticamente que esta solución es suficiente a largo plazo. También validaría el comportamiento del endpoint mediante métricas de rendimiento, profiling de consultas y pruebas de carga para entender cómo responde ante un mayor volumen de datos y concurrencia. Una solución que funciona correctamente con decenas de pólizas podría no comportarse igual cuando la cartera de clientes crezca o cuando múltiples asesores utilicen el sistema simultáneamente. Por ello, además de corregir el problema actual, evaluaría su impacto en términos de escalabilidad y capacidad de crecimiento.

---

## Problema 3 — La lógica de prioridad no refleja la ventana regulatoria de 30 días (línea ~44)

**Dónde**:
```python
priority = 'urgent' if days_overdue > 7 else 'normal'
```

**Qué está mal**: El threshold de 7 días para "urgente" es arbitrario y **no está alineado con la regla de negocio colombiana**. La ventana crítica real es de **30 días post-vencimiento**. Una póliza vencida hace 8 días aparece como "normal" cuando en realidad le quedan 22 días de ventana preferencial. Una póliza vencida hace 32 días —ya fuera de la ventana— aparece también como "urgent", cuando el daño ya está hecho y el nivel de urgencia es diferente (ahora compete con otros intermediarios, no es lo mismo que aún poder renovar en ventana).

Además, el campo `recommended_action` siempre dice lo mismo: `'Contactar urgentemente para evitar pérdida del cliente'`. Esto es inútil como información —si siempre dice lo mismo, no dice nada.

**Por qué importa en producción**: María usa esta prioridad para ordenar a quién llamar primero. Con la lógica actual, puede no llamar a un cliente vencido hace 6 días (aparece "normal") y dejarlo pasar a "urgente" después de 7 días, desperdiciando tiempo de la ventana. O puede estresarse llamando a alguien vencido hace 60 días con la misma urgencia que alguien que venció ayer.

**Qué comportamiento de negocio se rompe**: El asesor prioriza mal. Clientes que todavía se pueden salvar (vencidos hace 15 días, dentro de ventana) pueden quedar por debajo de clientes que ya están fuera de ventana y cuya pérdida ya es un hecho. María pierde 5–10 clientes al mes precisamente por esto.

**Cómo lo arreglaría**:

```python
def classify_priority(days_overdue):
    if days_overdue == 0:
        return 'expires_today'     # Vence hoy — llamar ahora
    elif 1 <= days_overdue <= 30:
        return 'critical_window'   # En ventana — aún renovable en condición preferencial
    elif days_overdue > 30:
        return 'outside_window'    # Fuera de ventana — nueva contratación, competencia abierta
    elif days_overdue < 0 and abs(days_overdue) <= 30:
        return 'expiring_soon'     # Vence pronto — contacto proactivo
    else:
        return 'active'
```

Y el `recommended_action` debería variar según el bucket:
- `critical_window`: "Renovar antes del {fecha_límite_30_días} para mantener historial del cliente"
- `outside_window`: "Ofrecer nueva contratación — cliente puede comparar con otros intermediarios"
- `expiring_soon`: "Llamar para anticipar renovación"

---

## Problema menor — `app.run(debug=True)` en producción (última línea)

**Dónde**: `app.run(debug=True)`

**Qué está mal**: `debug=True` activa el debugger interactivo de Werkzeug y el auto-reloader. Si hay un error no capturado, el debugger expone un REPL interactivo accesible desde el navegador que permite **ejecutar código Python arbitrario en el servidor**.

**Por qué importa**: Es una vulnerabilidad de ejecución remota de código (RCE) crítica. En el contexto de esta app, un atacante podría leer la base de datos completa de todos los asesores, modificar pólizas, o comprometer el servidor.

**Cómo lo arreglaría**: Usar una variable de entorno:
```python
debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
app.run(debug=debug)
```
Y en producción, no servir con `app.run()` sino con un servidor WSGI real (gunicorn, uvicorn).
