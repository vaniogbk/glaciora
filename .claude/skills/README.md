# Pack de 60 Skills Claude Code — SaaS Security + SEO

Ce pack contient **60 skills Claude Code** : 30 pour l'audit de sécurité et 30 pour le SEO.

## Installation

1. Décompressez l'archive à la racine du dépôt de votre SaaS.
2. Vérifiez que le dossier `.claude/skills/` est présent à la racine.
3. Ouvrez le projet avec Claude Code.
4. Les skills sont disponibles à partir de leurs descriptions. Vous pouvez aussi les appeler explicitement avec `/nom-du-skill`, par exemple `/owasp-top-10-auditor` ou `/seo-audit-engine`.
5. Commencez par les audits en lecture seule avant d'autoriser des modifications.

Le pack est structuré selon le format Claude Code :
`.claude/skills/<nom-du-skill>/SKILL.md`

## Les 30 skills de sécurité

1. reconnaissance-engine
2. subdomain-discovery
3. port-scanner
4. technology-fingerprinting
5. dns-security-auditor
6. ssl-tls-auditor
7. cloud-security-auditor
8. infrastructure-exposure-scanner
9. owasp-top-10-auditor
10. sql-injection-tester
11. xss-vulnerability-tester
12. csrf-security-tester
13. ssrf-vulnerability-tester
14. idor-bola-auditor
15. authentication-penetration-tester
16. session-security-auditor
17. api-penetration-tester
18. business-logic-tester
19. database-security-auditor
20. secrets-detection-scanner
21. dependency-vulnerability-scanner
22. file-upload-security-tester
23. rate-limiting-tester
24. access-control-auditor
25. encryption-auditor
26. ddos-resilience-auditor
27. waf-security-auditor
28. security-monitoring-analyst
29. incident-response-assistant
30. automated-security-remediation

## Les 30 skills SEO

1. seo-audit-engine
2. technical-seo-analyzer
3. website-crawler
4. sitemap-optimizer
5. robots-txt-auditor
6. indexability-checker
7. canonical-url-manager
8. core-web-vitals-optimizer
9. mobile-seo-auditor
10. structured-data-generator
11. keyword-research-engine
12. search-intent-analyzer
13. keyword-difficulty-analyzer
14. competitor-seo-intelligence
15. keyword-clustering
16. content-gap-analyzer
17. seo-content-writer
18. content-optimization-engine
19. topical-authority-builder
20. blog-strategy-generator
21. on-page-seo-optimizer
22. meta-tags-optimizer
23. internal-linking-builder
24. image-seo-optimizer
25. backlink-profile-analyzer
26. link-building-strategist
27. google-search-console-analyst
28. google-analytics-4-analyst
29. seo-ranking-monitor
30. seo-reporting-automation

## Premier lancement recommandé

### Sécurité
Exécutez d'abord les skills de revue du code et de configuration :
- `/owasp-top-10-auditor`
- `/api-penetration-tester`
- `/authentication-penetration-tester`
- `/idor-bola-auditor`
- `/secrets-detection-scanner`
- `/dependency-vulnerability-scanner`
- `/database-security-auditor`

Demandez un **rapport uniquement, sans modification**. Corrigez ensuite les findings par lots, avec tests de non-régression et revue humaine.

### SEO
Commencez par :
- `/seo-audit-engine`
- `/website-crawler`
- `/technical-seo-analyzer`
- `/indexability-checker`
- `/core-web-vitals-optimizer`
- `/keyword-research-engine`
- `/search-intent-analyzer`

N'automatisez pas la publication de pages, les changements d'indexation, les redirections ou les modifications de production sans revue.

## Règles de sécurité impératives

- Les tests offensifs sont autorisés uniquement sur les systèmes que vous possédez ou pour lesquels vous avez une autorisation écrite.
- Le périmètre doit préciser les domaines, IP, environnements, comptes de test, limites de débit et exclusions.
- Utilisez un environnement **staging** avec données synthétiques pour les tests actifs.
- Aucun test DDoS, flood, brute force, credential stuffing, exploitation destructive ou exfiltration de données.
- Aucun skill ne doit déployer automatiquement un correctif en production.
- Les correctifs doivent être réalisés sur une branche, testés, relus et approuvés.
- Pour le SEO, privilégiez le contenu utile et original. Pas de cloaking, contenu caché, pages doorway, faux avis, achat de liens ou spam.

## Ce que ce pack fait — et ne fait pas

Un skill Claude Code est un ensemble d'instructions réutilisables que Claude peut invoquer dans un projet. Ce n'est pas, à lui seul, un scanner autonome, un service de monitoring permanent ou une garantie de sécurité/référencement. Certains contrôles nécessitent des outils externes, des accès API, des exports ou une configuration adaptée. Les skills demandent de signaler ces dépendances au lieu de prétendre qu'un contrôle a été effectué.

## Personnalisation recommandée

Avant le premier audit, ajoutez au dépôt un document interne décrivant :
- architecture réelle (frontend, backend, base de données, hébergement);
- domaines et environnements autorisés;
- modèle d'authentification et de multi-tenancy;
- données sensibles et obligations de conservation;
- parcours critiques (inscription, paiement, abonnement, remboursement, administration);
- marchés, langues et objectifs SEO.

Ne mettez jamais de secrets ou de données personnelles dans ce document.
