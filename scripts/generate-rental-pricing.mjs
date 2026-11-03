import fs from 'node:fs';
import ts from 'typescript';
export function rentalPricingSource(){
 const source=ts.transpileModule(fs.readFileSync('lib/rental-pricing.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 return '// Generado desde lib/rental-pricing.ts. No editar por separado.\nconst RentalPricing = (() => { const exports = {};\n'+source+'\nreturn exports; })();\n';
}
if(process.argv.includes('--check')){if(fs.readFileSync('backend/RentalPricing.gs','utf8').replace(/\r\n/g,'\n')!==rentalPricingSource())throw new Error('Regenerá RentalPricing.gs.');}
else fs.writeFileSync('backend/RentalPricing.gs',rentalPricingSource());
