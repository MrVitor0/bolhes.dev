import localhost from "../../../examples/localhost-nao-paga.bolhes?raw";
import rubyPython from "../../../examples/ruby-python.bolhes?raw";
import canon from "../../../examples/canon.bolhes?raw";
import product from "../../../examples/product.bolhes?raw";
import defaultDemo from "../../../examples/default.bolhes?raw";

export const demos = [
  { name: "localhost não paga", source: localhost },
  { name: "dialeto Ruby/Python", source: rubyPython },
  { name: "canon e fundamentos", source: canon },
  { name: "produto e deploy", source: product },
  { name: "pragma padrão", source: defaultDemo },
];
