export const merge = (...args: any[]) => {
  let out = {}
  args.forEach((arg) => {
    out = { ...out, ...arg }
  })
  return out
}