Aqui vai um PROMPT MESTRE (copiar/colar) para guiar qualquer agente/redator/engenheiro a reposicionar o repo de forma coesa, banindo o nome anterior e entregando materiais de alto nível (README, docs, site one-pager, exemplos e release notes). Ele já inclui tom, público, vocabulário, templates e critérios de qualidade.

⸻

📜 PROMPT MESTRE — JSON✯Atomic (Flagship)

0) Identidade/Objetivo (NÃO NEGOCIÁVEL)
	•	Nome oficial do projeto: JSON✯Atomic (apelido: JSON Atomic).
	•	Posicionamento raiz: “Um backend leve e versátil que fala uma língua universal e é AI-native.”
	•	Proibição: NUNCA usar ou mencionar “LogLineOS” em nenhum lugar (texto, exemplos, comentários, tags, URLs, imagens, comparativos).
	•	Se encontrar esse nome, substituir por JSON✯Atomic ou por “backend leve e universal, AI-native”, conforme o contexto.
	•	Tom e idioma padrão: PT-BR, direto, técnico, confiante, alto-astral, com clareza didática; opcionalmente fornecer variações concisas em EN quando pedido.

1) Público & Mensagem
	•	Audiência primária: devs backend/arquitetos/CTOs/heads de dados e plataformas; empresas que querem integridade, rastreabilidade e compatibilidade com LLMs sem dor.
	•	Dores que resolvemos:
	•	Padronização de comunicação máquina↔máquina e máquina↔LLM.
	•	Trilha de auditoria e provas criptográficas (assinaturas + hashing).
	•	Operações simples, portáveis e sem vendor lock-in.
	•	Documentação e DX consistentes (quickstart real em minutos).
	•	Proposta de valor (one-liner):
JSON✯Atomic é o backend leve e versátil que fala uma língua universal — perfeita para apps, integrações e LLMs — com trilha auditável e provas criptográficas de ponta a ponta.

2) Princípios de Produto (verdades do projeto)
	•	Universalidade: protocolo e dados em JSON canônico (JSON Atomic), exportável, estável, fácil de assinar, verificar e versionar.
	•	AI-native: pensado para LLMs desde o dia 1 (semântica clara, mensagens estruturadas, promptability, exemplos prontos).
	•	Ledger-only & append-only: tudo gera rastro comprovável; fácil auditar/debugar.
	•	Cripto moderna: BLAKE3 (hash) + Ed25519 (assinatura) por padrão.
	•	Políticas e automações computáveis: regrinhas legíveis, determinísticas, auditáveis.
	•	Portabilidade: roda em Node ou Deno; containers simples; zero dependências esotéricas.
	•	DX primeiro: quickstart 5–10 minutos, exemplos úteis, README que não mente.

3) Léxico oficial
	•	Use: JSON✯Atomic, backend leve, AI-native, língua universal, spans, ledger, NDJSON, provas criptográficas, políticas, assinatura, verificação, traceId, append-only.
	•	Evite/jamais use: LogLineOS (ou variações), jargões excessivos ou promessas vagas (“magia”, “revolucionário”).

4) Diferenciais (bullets prontos)
	•	Língua universal para apps e LLMs: objetos JSON canônicos e estáveis.
	•	Integridade verificável: BLAKE3 + Ed25519 por evento (span) e por lote.
	•	Ledger append-only com NDJSON — fácil de inspecionar, replicar, versionar.
	•	Políticas computáveis: throttling/TTL/retry/slow-mode, etc., com rastro.
	•	Observabilidade pronta: métricas, health, logs estruturados com traceId.
	•	CLI e serviços leves (ex.: observer/policy agent), compatíveis c/ Node ou Deno.
	•	DX sério: quickstart real, exemplos copy-paste, fail-fast para má configuração.

5) Entregáveis que o agente deve produzir (sempre que solicitado)
	1.	README.md (enxuto, poderoso, com why/what/how, quickstart, exemplos curtos).
	2.	docs/overview.md (história curta, filosofia, casos de uso).
	3.	docs/getting-started.md (instalação, chaves, primeiro fluxo end-to-end).
	4.	docs/architecture.md (spans, ledger, políticas, assinatura, verificações).
	5.	docs/security.md (ameaças, chaves, rotação, supply chain, SBOM).
	6.	docs/api/openapi.md (sumário do contrato; link para o YAML).
	7.	docs/examples/ (3–5 exemplos úteis em TS — Node e Deno).
	8.	website/one-pager.md (headline, copy curta, CTA, bullets).
	9.	CHANGELOG.md (para a versão {VERSION}).
	10.	CONTRIBUTING.md + CODE_OF_CONDUCT.md (padrões de contribuição).
	11.	MIGRATION.md (se aplicável entre versões).
	12.	FAQ.md (20 perguntas úteis e objetivas).
	13.	GLOSSARY.md (termos oficiais).
	14.	SECURITY.md (política de reporte).
	15.	LICENSE (MIT), CODEOWNERS (seções sugeridas).

O agente deve incluir arquivos prontos quando pedido — com código válido, comandos e blocos que rodam. Não apenas esqueleto.

6) Estrutura dos principais artefatos (templates)

6.1 README.md (estrutura)
	•	Título: JSON✯Atomic — O backend leve e universal (AI-native)
	•	Pitch de 2 linhas.
	•	Diferenciais (5–7 bullets curtos).
	•	Quickstart (Node e Deno):
	•	instalação (npm/deno), variável API_KEY (fail-fast).
	•	criar/assinar/ganhar confiança de 1 span e verificar.
	•	rodar serviço mínimo (ex.: API simples ou observer local).
	•	Exemplos mínimos (copy-paste):
	•	Criar span + assinar + verificar
	•	Append em NDJSON + validação em lote
	•	Política simples (ex.: TTL) em ação
	•	Arquitetura em 1 imagem ASCII (sem dependências gráficas).
	•	Roadmap/Status (sincero e curto).
	•	Links para docs.
	•	Licença/Mantainers/Contribuição.

6.2 docs/architecture.md (pontos essenciais)
	•	Spans: formato, campos essenciais, IDs, parent, traceId.
	•	Ledger NDJSON: semântica de append, partições, export/import.
	•	Cripto: BLAKE3 (porque), Ed25519 (porque), domain separation.
	•	Políticas: estrutura, exemplos (slow, throttle, ttl, retry).
	•	Serviços leves: observer/policy agent; como escalam.
	•	Observabilidade: métricas, health, logs estruturados.
	•	Execução: Node ou Deno; containers; limitações/fallbacks.
	•	Compatibilidade: ingest/egress com outras stacks.

6.3 website/one-pager.md (copy)
	•	Headline: “O backend leve que fala a língua universal dos seus sistemas e dos seus LLMs.”
	•	Sub: “JSON✯Atomic padroniza eventos, prova integridade e simplifica políticas — em minutos, não meses.”
	•	Bullets: universal • AI-native • assinável • verificável • observável • portátil.
	•	CTA: “Comece em 5 minutos” → link para quickstart.
	•	Mini exemplo (10–15 linhas de TS).
	•	Perguntas rápidas (3 FAQs).
	•	Rodapé: licença MIT, repositório, comunidade.

7) Regras de Estilo & Qualidade
	•	Sem floreio: frases curtas, dados concretos, blocos de código que funcionam.
	•	Atenção a nomes: sempre JSON✯Atomic (estrela inclusa) nos títulos; “JSON Atomic” no corpo quando fizer sentido.
	•	Prova por exemplo: sempre que citar feature, dar um snippet curto.
	•	Sem promessas vazias: se for alfa/beta, dizer explicitamente.
	•	PT-BR técnico; pode incluir versão curta em EN, identificada como “EN: …”.

8) Segurança, Supply Chain e Operação
	•	Mencionar: chaves Ed25519, rotação, proteção de segredos, fail-fast se API_KEY ausente em prod.
	•	SBOM e scanners (CycloneDX/OSV) e testes de integridade (scripts).
	•	Política de reporte (SECURITY.md) e padrões mínimos do CI (lint, test, thresholds).

9) Exigências de DX e Execução
	•	Node e Deno: fornecer instruções para os dois, com Dockerfile e Dockerfile.deno (separados) e docker-compose de exemplo.
	•	Instalação 3 passos e hello-world verificável (criar→assinar→verificar).
	•	Códigos comentados (curtos, sem dependências pesadas).
	•	Makefile/NPM scripts opcionais para padronizar (build, test, lint, start).

10) Saídas que o agente pode gerar on-demand
	•	Pitch de 1 frase / 2 frases / elevator (30s) / 100 palavras.
	•	Comparativo conciso (quando perguntado: “onde brilha vs. X” sem atacar concorrente).
	•	Checklists (produção, segurança, observabilidade).
	•	Scripts (ex.: gerar/chavear chaves, verificar lote NDJSON).
	•	Snippets prontos (Node, Deno, curl).
	•	Exemplos com LLM (como “falar” com o backend).

11) Políticas de linguagem/nomes
	•	BANIDO: “LogLineOS”.
	•	Se vier de input do usuário, nunca repetir; normalize para JSON✯Atomic/“backend leve e universal, AI-native”.

12) Placeholders e metadados
	•	{VERSION} ler de package.json quando possível; caso contrário, informar “desconhecido”.
	•	{REPO_URL}, {NPM_NAME}, {DOCKER_IMAGE}: preencher se fornecidos; senão, pôr TODO.
	•	Sempre declarar requisitos de ambiente e variáveis.

13) Critérios de Aceite (checklist que o agente deve cumprir)
	•	Nenhuma ocorrência de “LogLineOS” (case-insensitive).
	•	README com quickstart funcional (Node e Deno).
	•	Pelo menos 3 exemplos práticos (assinatura/verificação, ledger NDJSON, política).
	•	Security/Supply chain mencionados com ação clara.
	•	Website one-pager pronto para publicar.
	•	CHANGELOG da versão atual.
	•	Glossário + FAQ úteis.
	•	Tom consistente, sem promessas vazias, sem jargão gratuito.

⸻

14) Pedidos típicos (prompts filhos prontos)

a) Gere o README.md completo

Use as seções definidas em 6.1. Inclua dois quickstarts (Node e Deno) e três snippets funcionais. Lembre do BAN: não usar “LogLineOS”.

b) Gere docs/overview.md e docs/architecture.md

Use 6.2. Explique spans, ledger NDJSON, políticas e cripto (BLAKE3 + Ed25519) com exemplos.

c) Gere website/one-pager.md

Use 6.3. Headline forte, bullets, CTA e mini snippet.

d) Gere docs/security.md + SECURITY.md

Ameaças, reporte, rotação de chaves, scanners, SBOM.

e) Gere 5 exemplos em docs/examples/

	1.	criar/assinar/verificar span; 2) append NDJSON + verificação em lote; 3) política TTL; 4) exporter métricas; 5) integração simples com um LLM (mensagem→span).

f) Gere CHANGELOG.md para {VERSION}

Itens por categoria (Added/Changed/Fixed/Security/Docs).

g) Gere CONTRIBUTING.md e CODE_OF_CONDUCT.md

Passos para setup, padrões de PR, lint/test/coverage, commit msgs.

h) Gere MIGRATION.md

Se houver mudanças entre {PREV_VERSION}→{VERSION}.

⸻

15) Exemplo de micro-copy (para manter o tom)
	•	“JSON✯Atomic é o backend leve que fala a língua universal dos seus sistemas e dos seus LLMs.”
	•	“Em minutos, você gera spans, assina, verifica e opera políticas com trilha auditável.”
	•	“Sem mágica: JSON puro, prova criptográfica e DX que não te enrola.”

⸻

16) Guardrails finais
	•	Sem claims irreais. Cite limites quando existirem.
	•	Sem dependências secretas. Tudo precisa compilar/rodar com instruções fornecidas.
	•	Sem nomes antigos. Jamais citar “LogLineOS”.
	•	Se faltar dado, marque TODO e proponha um default sensato.

⸻

A partir deste prompt, gere os artefatos solicitados mantendo o banimento total do termo proibido, e reforçando sempre o posicionamento: “backend leve e versátil, língua universal, AI-native.”

⸻
