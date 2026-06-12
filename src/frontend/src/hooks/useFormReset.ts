import { useCallback } from 'react'

type ResetEntry<T> = [React.Dispatch<React.SetStateAction<T>>, T]

// Recibe una lista de tuplas [setter, valorInicial] y devuelve una función
// que restaura todos los campos a su valor inicial de una sola vez.
export function useFormReset(entries: Array<ResetEntry<any>>) {
  return useCallback(() => {
    entries.forEach(([setter, defaultValue]) => setter(defaultValue))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
