import {test,expect} from '@playwright/test';
import {setupAdmin} from './admin-quick-fixture.mjs';

test('una contraseña nueva bloquea la pestaña anterior y permite volver a ingresar sin perder productos',async({page})=>{
 const state=await setupAdmin(page);
 await page.locator('.admin-tabs').getByRole('button',{name:'Disfraces',exact:true}).click();
 const row=page.getByRole('region',{name:'Productos de Disfraces',exact:true}).getByRole('row',{name:'Súper Héroe Niño',exact:true});
 await expect(row).toBeVisible();
 const before=structuredClone(state.tables.disfraces);
 state.settings.ADMIN_PASSWORD='new-test-password-67890';
 await row.getByRole('switch').click();
 await expect(page.locator('main').getByRole('alert')).toContainText('Sesión vencida');
 await expect(row.getByRole('switch')).toBeChecked();
 expect(state.writes).toHaveLength(0);
 expect(state.tables.disfraces).toEqual(before);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Acceso administrador',exact:true})).toBeVisible();
 await page.getByLabel('Usuario',{exact:true}).fill('admin');
 await page.getByLabel('Contraseña',{exact:true}).fill(state.settings.ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Ingresar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Cerrar sesión',exact:true})).toBeVisible();
 expect(state.tables.disfraces).toEqual(before);
});
