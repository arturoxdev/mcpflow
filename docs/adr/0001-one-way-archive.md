# One-way archive for Boards

Archiving a Board is irreversible from the application: there is no "Unarchive" action, no "Archived" view, and no API endpoint to restore. Recovery requires clearing `boards.archived_at` directly in the database. We chose this over a reversible archive to keep v1 small — a reversible model needs a dedicated archived-items UI, restore endpoints, and decisions about what to do with stale public-inbox links — and because Boards are typically archived at end-of-project (e.g. "Cliente X — Q1") and rarely need to come back. The implementation must still preserve all original state (notably `publicInboxEnabled` is **not** mutated on archive) so that adding a reversible flow later restores exact prior behavior without guesswork.

## Consequences

- The button is labeled **"Archivar"**, not **"Eliminar"**, even though from the UI's perspective the effect is similar. The word signals to the user that data is preserved, not destroyed.
- The confirmation dialog explicitly says "Esta acción no se puede revertir desde la app" — precise language matters because reversibility *does* exist, just not via the product surface.
- Filtering happens in the service layer (`@repo/core`), so web, MCP, and any future consumer inherit the invisibility automatically.
- A future "unarchive" feature is purely additive: new endpoint `POST /api/boards/{id}/unarchive`, new method `boardService.unarchive`, optional new view. No data backfill needed because state was preserved.
