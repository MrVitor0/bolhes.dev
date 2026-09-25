import { getValue } from "./value.bolhes";
export { getValue as getValueThroughBarrel } from "./value.bolhes";

const result: number = getValue();
console.log(result);

export async function loadValue() {
  const module = await import("./value.bolhes");
  return module.getValue();
}
