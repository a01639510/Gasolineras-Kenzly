# Graph Report - .  (2026-07-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 110 nodes · 229 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9eb293c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `renderForm()` - 22 edges
2. `renderField()` - 11 edges
3. `save()` - 10 edges
4. `newProject()` - 10 edges
5. `init()` - 10 edges
6. `g()` - 9 edges
7. `renderLiveDoc()` - 9 edges
8. `badge()` - 8 edges
9. `build()` - 8 edges
10. `saveCurrentProject()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `redactarSeccion()` --calls--> `build()`  [INFERRED]
  api/redactar.js → documento.js
- `build()` --calls--> `g()`  [INFERRED]
  documento.js → app.js
- `build()` --calls--> `interp()`  [INFERRED]
  documento.js → app.js

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.31
Nodes (13): deleteProject(), fmtDate(), hideHome(), loadIdx(), migrateOldData(), newProject(), normalize(), openProject() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.24
Nodes (6): extraerPerfil(), extraerPrograma(), fetchSheetCSV(), limpiarMarkdown(), PROMPTS, redactarSeccion()

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (11): addFigura(), editTitulo(), g(), guardarJSON(), onEstadoChange(), programarLive(), save(), toast() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (11): bindAnexos(), bindChecklist(), bindFiguras(), bindIA(), bindImportar(), bindInputs(), bindProgramas(), bindSusDinamica() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (11): buildBlocks(), contarNuevos(), contarPendientes(), exportWord(), figList(), mostrarVista(), paras(), renderBlocks() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (10): badge(), renderAnexos(), renderChecklist(), renderEstrategias(), renderField(), renderInstrumentos(), renderProgramas(), renderPuntos() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (9): fileToDataURL(), idbAll(), idbOpen(), idbPut(), init(), setImagen(), showHome(), toggleFocus() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.60
Nodes (5): actividades(), build(), empty(), fechaLarga(), gantt()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, outputDirectory, $schema

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (4): fmtMoney(), interp(), makeCtx(), numerarFiguras()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (3): delImagen(), idbDel(), removeFigura()

## Knowledge Gaps
- **6 isolated node(s):** `PROMPTS`, `$schema`, `framework`, `buildCommand`, `installCommand` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build()` connect `Community 8` to `Community 10`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Why does `redactarSeccion()` connect `Community 2` to `Community 8`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `g()` connect `Community 3` to `Community 0`, `Community 1`, `Community 5`, `Community 6`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `init()` (e.g. with `guardarJSON()` and `showHome()`) actually correct?**
  _`init()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PROMPTS`, `$schema`, `framework` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._