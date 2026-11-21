# Project installment editor: operator draft only

Open an existing project in `/admin/projects` → Installments. Enter 1–12
percentage splits totaling exactly 100%, each due on an explicit calendar date
or a selected milestone (reservation, contract, construction, handover).
Calendar dates must be valid and nondecreasing. The browser can download a
project-bound `myuno-project-installments-v1` draft for review. Switching editor
tabs retains the current draft; closing the editor discards it. The project Save
action does not send the draft to the database.

The recognized marker fits the intent of the existing
`property_projects.payment_plan_template` field. No conversion of legacy
`payment_plan`, special-term text or unknown template JSON is implied.
There is no storage migration, write path, public rendering, reservation,
invoice, payment obligation or amount calculation. No data is put in localStorage,
sent to an external service, or published by the form.

Do not persist through the base project table until actual column/role policy
and the existing private writer or evidence flow are verified. A browser UI
allowlist is not authorization; authenticated table readers may otherwise see
an unpublished draft in any otherwise readable project. The future writer
needs exact project/actor admission and expected current revision.
