"""Observe real portal transitions before measuring or sending keyboard input.

No animation overrides, forced focus, synthetic animation events or retries.
"""
import json


DIALOG_SETTLED = """e=>{
    if(!e.isConnected)return false;
    const r=e.getBoundingClientRect(),now=performance.now();
    const active=e.getAnimations().some(a=>a.pending||a.playState==='running');
    const previous=window.fixtureDialogPositions??=new WeakMap();
    const before=previous.get(e);
    const position=[r.x,r.y,r.width,r.height];
    if(active||!before||position.some((v,i)=>Math.abs(v-before.position[i])>.25)){
        previous.set(e,{position,since:now});return false;
    }
    return now-before.since>=100;
}"""


async def dialog_diagnostics(page, dialog):
    nodes = await dialog.element_handles()
    return await page.evaluate("""e=>({
        dialog:e?{state:e.getAttribute('data-state'),rect:e.getBoundingClientRect().toJSON(),
            transform:getComputedStyle(e).transform,
            animations:e.getAnimations().map(a=>({state:a.playState,pending:a.pending,time:a.currentTime})),
            containsFocus:e.contains(document.activeElement)}:null,
        focus:document.activeElement?.outerHTML.slice(0,500),
        menus:[...document.querySelectorAll('[role="menu"]')].map(e=>({state:e.getAttribute('data-state'),rect:e.getBoundingClientRect().toJSON()})),
        dialogs:[...document.querySelectorAll('[role="dialog"]')].map(e=>({state:e.getAttribute('data-state'),rect:e.getBoundingClientRect().toJSON()}))
    })""", nodes[0] if nodes else None)


async def wait_for_dialog_ready(page, dialog, *, keyboard=False, failure_path=None):
    try:
        # A closing Radix menu remains a dismissable layer until its exit animation
        # unmounts it. Visibility of the newly opened sheet alone is insufficient.
        if keyboard:
            await page.locator('[role="menu"]').wait_for(state='detached', timeout=5000)
        node = await dialog.element_handle(timeout=5000)
        await page.wait_for_function(DIALOG_SETTLED, arg=node, polling='raf', timeout=5000)
        if keyboard:
            await page.wait_for_function('e=>e.contains(document.activeElement)', arg=node, timeout=5000)
        return await dialog_diagnostics(page, dialog)
    except Exception as error:
        diagnostics = await dialog_diagnostics(page, dialog)
        if failure_path is not None:
            failure_path.with_suffix('.json').write_text(json.dumps(diagnostics, indent=2), encoding='utf-8')
            await page.screenshot(path=str(failure_path.with_suffix('.png')), full_page=True)
        raise AssertionError({'dialogReadiness': diagnostics, 'error': str(error)}) from error
