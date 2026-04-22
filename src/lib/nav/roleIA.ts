/**
 * Role & product boundaries — single reference for navigation / IA.
 *
 * `NavRoleKey` (see `navConfig.ts`) drives primary bottom bar + top pills.
 * Workspace roles also get contextual patterns (side rail or dedicated layout).
 *
 * ## URL families (mental model)
 *
 * - `/` … consumer discovery (guest / investor when not in a workspace shell)
 * - `/invest/*` … investor capital surfaces
 * - `/my-property/*` … owner portal (properties run by an MC) — read-heavy B2C
 * - `/mc/*` … management company operator (PMS / “Control Tower”)
 * - `/owner/*` … property owner transparency & legacy owner flows (same `owner` nav role as `/mc` when resolved from URL)
 * - `/vendor/*` … service provider fulfilment
 * - `/admin/*` … platform administration
 * - `/team/*` … internal UNO team — uses **TeamLayout** + **TeamSidebar** (not the global SideRail) to support gamification and spec-based items
 * - `/staff/*`, `/capital/*` … **separate product shells** (intentional); not `NavRoleKey`-driven
 *
 * ## Shell matrix
 *
 * | Key          | Primary nav   | Left chrome                                      |
 * |--------------|--------------|--------------------------------------------------|
 * | guest        | 5-tab + Apps | None (consumer)                                    |
 * | investor     | 5-tab + Apps | None                                             |
 * | mc_portal    | 4-tab + Apps | None (portal; not MC operator workspace)         |
 * | owner        | 5-tab        | SideRail (grouped `OWNER_SIDEBAR`)                 |
 * | vendor       | 5-tab        | SideRail                                           |
 * | admin        | 5-tab        | SideRail                                           |
 * | team         | 5-tab        | **TeamSidebar** in `TeamLayout` (not SideRail)   |
 *
 * ## Naming notes
 *
 * - **owner** in `NavRoleKey` means “workspace operator persona” (MC dashboard), not the B2C “my property” owner portal — that is **mc_portal**.
 * - **team** and **admin** can share the same admin routes (CRM, moderation) with aligned labels; see `TEAM_NAV` / `ADMIN_NAV` in `navConfig.ts`.
 */
export {};
