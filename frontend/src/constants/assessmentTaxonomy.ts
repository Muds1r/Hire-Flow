export type TaxonomySkill = {
  id: string;
  label: string;
};

export type TaxonomyGroup = {
  id: string;
  label: string;
  skills: TaxonomySkill[];
};

export type TaxonomyDomain = {
  id: string;
  label: string;
  description?: string;
  groups: TaxonomyGroup[];
};

function skills(...labels: string[]): TaxonomySkill[] {
  return labels.map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
  }));
}

function group(id: string, label: string, skillLabels: string[]): TaxonomyGroup {
  return { id, label, skills: skills(...skillLabels) };
}

function domain(
  id: string,
  label: string,
  groups: TaxonomyGroup[],
  description?: string,
): TaxonomyDomain {
  return { id, label, description, groups };
}

/** Standard skill taxonomy for evaluator assessment plans. */
export const ASSESSMENT_TAXONOMY: TaxonomyDomain[] = [
  domain('frontend', 'Frontend Development', [
    group('fe-core-languages', 'Core Languages', [
      'HTML5',
      'CSS3',
      'JavaScript (ES6+)',
      'TypeScript',
    ]),
    group('fe-react-ecosystem', 'React Ecosystem', [
      'React',
      'Next.js',
      'Remix',
      'Gatsby',
    ]),
    group('fe-vue-ecosystem', 'Vue Ecosystem', ['Vue.js', 'Nuxt.js']),
    group('fe-angular-ecosystem', 'Angular Ecosystem', ['Angular']),
    group('fe-other-frameworks', 'Other Modern Frameworks', [
      'Svelte',
      'SvelteKit',
      'SolidJS',
      'Qwik',
      'Astro',
    ]),
    group('fe-css-frameworks', 'CSS Frameworks', [
      'Tailwind CSS',
      'Bootstrap',
      'Bulma',
      'Foundation',
    ]),
    group('fe-component-libraries', 'Component Libraries', [
      'Material UI (MUI)',
      'Ant Design',
      'Chakra UI',
      'Mantine',
      'ShadCN UI',
    ]),
    group('fe-css-methodologies', 'CSS Methodologies', [
      'BEM',
      'CSS Modules',
      'Atomic CSS',
    ]),
    group('fe-preprocessors', 'Preprocessors', ['Sass/SCSS', 'Less', 'Stylus']),
    group('fe-state-management', 'State Management', [
      'Redux Toolkit',
      'Zustand',
      'MobX',
      'Recoil',
      'Jotai',
      'Context API',
      'Vuex',
      'Pinia',
    ]),
    group('fe-data-fetching', 'Frontend Data Fetching', [
      'React Query / TanStack Query',
      'SWR',
      'Apollo Client',
      'Relay',
    ]),
    group('fe-testing', 'Frontend Testing', [
      'Jest',
      'Vitest',
      'Cypress',
      'Playwright',
      'React Testing Library',
      'Puppeteer',
    ]),
    group('fe-build-tools', 'Frontend Build Tools', [
      'Vite',
      'Webpack',
      'Turbopack',
      'Rollup',
      'Parcel',
      'Babel',
      'SWC',
      'ESBuild',
    ]),
    group('fe-architectures', 'Frontend Architectures', [
      'SPA',
      'SSR',
      'SSG',
      'ISR',
      'Micro Frontends',
      'JAMstack',
    ]),
  ]),
  domain('backend', 'Backend Development', [
    group('be-languages', 'Backend Languages', [
      'Node.js',
      'Python',
      'Java',
      'Go',
      'Rust',
      'C#',
      'PHP',
      'Ruby',
      'Kotlin',
      'Scala',
      'Elixir',
    ]),
    group('be-node-frameworks', 'Node.js Frameworks', [
      'Express.js',
      'NestJS',
      'Fastify',
      'Hono',
      'Koa',
      'AdonisJS',
    ]),
    group('be-python-frameworks', 'Python Frameworks', [
      'Django',
      'FastAPI',
      'Flask',
      'Tornado',
    ]),
    group('be-java-frameworks', 'Java Frameworks', [
      'Spring Boot',
      'Micronaut',
      'Quarkus',
    ]),
    group('be-go-frameworks', 'Go Frameworks', ['Gin', 'Fiber', 'Echo', 'Buffalo']),
    group('be-dotnet', '.NET', ['ASP.NET Core', 'Blazor']),
    group('be-php', 'PHP', ['Laravel', 'Symfony', 'CodeIgniter']),
    group('be-ruby', 'Ruby', ['Ruby on Rails', 'Sinatra']),
    group('be-apis', 'APIs & Communication', [
      'REST',
      'GraphQL',
      'gRPC',
      'WebSockets',
      'Server-Sent Events',
      'SOAP',
    ]),
    group('be-auth-security', 'Authentication & Security', [
      'JWT',
      'OAuth2',
      'OpenID Connect',
      'SAML',
      'RBAC',
      'ABAC',
      'Session Authentication',
    ]),
    group('be-architectures', 'Backend Architectures', [
      'Monolith',
      'Modular Monolith',
      'Microservices',
      'Event-Driven Architecture',
      'Serverless',
      'Hexagonal Architecture',
      'Clean Architecture',
      'CQRS',
      'DDD',
    ]),
  ]),
  domain('databases', 'Databases', [
    group('db-sql', 'SQL Databases', [
      'PostgreSQL',
      'MySQL',
      'MariaDB',
      'MSSQL',
      'Oracle DB',
      'SQLite',
    ]),
    group('db-document', 'Document Databases', [
      'MongoDB',
      'CouchDB',
      'Firebase Firestore',
    ]),
    group('db-key-value', 'Key-Value', ['Redis', 'DynamoDB']),
    group('db-wide-column', 'Wide Column', ['Cassandra', 'HBase']),
    group('db-graph', 'Graph Databases', ['Neo4j', 'ArangoDB']),
    group('db-time-series', 'Time Series', ['InfluxDB', 'TimescaleDB']),
    group('db-search', 'Search Engines', [
      'Elasticsearch',
      'OpenSearch',
      'Solr',
      'Meilisearch',
      'Algolia',
    ]),
    group('db-orm-js', 'ORM / Database Tools — JavaScript', [
      'Prisma',
      'TypeORM',
      'Sequelize',
      'Drizzle ORM',
      'Mongoose',
    ]),
    group('db-orm-python', 'ORM / Database Tools — Python', [
      'SQLAlchemy',
      'Django ORM',
    ]),
    group('db-orm-java', 'ORM / Database Tools — Java', ['Hibernate']),
  ]),
  domain('devops', 'DevOps', [
    group('devops-containers', 'Containers', ['Docker', 'Podman']),
    group('devops-orchestration', 'Container Orchestration', [
      'Kubernetes',
      'Docker Swarm',
      'Nomad',
      'OpenShift',
    ]),
    group('devops-cicd', 'CI/CD', [
      'GitHub Actions',
      'GitLab CI/CD',
      'Jenkins',
      'CircleCI',
      'Azure DevOps',
      'TeamCity',
      'ArgoCD',
    ]),
    group('devops-iac', 'Infrastructure as Code', [
      'Terraform',
      'Pulumi',
      'CloudFormation',
      'Ansible',
      'Chef',
      'Puppet',
    ]),
    group('devops-monitoring', 'Monitoring & Observability', [
      'Prometheus',
      'Grafana',
      'Datadog',
      'New Relic',
      'ELK Stack',
      'Loki',
      'Jaeger',
      'OpenTelemetry',
    ]),
    group('devops-service-mesh', 'Service Mesh', ['Istio', 'Linkerd', 'Consul']),
  ]),
  domain('cloud', 'Cloud Computing', [
    group('cloud-aws-compute', 'AWS — Compute', [
      'EC2',
      'Lambda',
      'ECS',
      'EKS',
      'Fargate',
    ]),
    group('cloud-aws-storage', 'AWS — Storage', ['S3', 'EBS', 'Glacier']),
    group('cloud-aws-databases', 'AWS — Databases', [
      'RDS',
      'DynamoDB',
      'Aurora',
      'Redshift',
    ]),
    group('cloud-aws-networking', 'AWS — Networking', [
      'VPC',
      'CloudFront',
      'Route53',
      'API Gateway',
    ]),
    group('cloud-azure', 'Azure', [
      'Azure Functions',
      'AKS',
      'CosmosDB',
      'Blob Storage',
    ]),
    group('cloud-gcp', 'Google Cloud', [
      'GKE',
      'Cloud Run',
      'BigQuery',
      'Firebase',
    ]),
    group('cloud-edge-cdn', 'Edge & CDN', [
      'Cloudflare',
      'Fastly',
      'Akamai',
      'Vercel Edge',
      'Netlify Edge',
    ]),
  ]),
  domain('ai-ml', 'AI / Machine Learning', [
    group('ai-frameworks', 'AI Frameworks', [
      'TensorFlow',
      'PyTorch',
      'JAX',
      'Scikit-learn',
      'Keras',
      'XGBoost',
    ]),
    group('ai-deep-learning', 'Deep Learning', [
      'CNN',
      'RNN',
      'Transformers',
      'Diffusion Models',
    ]),
    group('ai-generative', 'Generative AI', [
      'OpenAI APIs',
      'Claude APIs',
      'Gemini APIs',
      'Grok APIs',
      'Llama Models',
      'Mistral Models',
    ]),
    group('ai-engineering', 'AI Engineering', [
      'LangChain',
      'LangGraph',
      'CrewAI',
      'Haystack',
      'Semantic Kernel',
      'AutoGen',
    ]),
    group('ai-vector-db', 'Vector Databases', [
      'Pinecone',
      'Weaviate',
      'Qdrant',
      'ChromaDB',
      'FAISS',
      'Milvus',
    ]),
    group('ai-infrastructure', 'AI Infrastructure', [
      'CUDA',
      'TensorRT',
      'ONNX',
      'Triton Inference Server',
      'vLLM',
      'Ollama',
    ]),
    group('ai-rag', 'RAG Systems', [
      'Embeddings',
      'Chunking',
      'Re-ranking',
      'Hybrid Search',
      'Prompt Orchestration',
    ]),
    group('ai-mlops', 'MLOps', [
      'MLflow',
      'Kubeflow',
      'Weights & Biases',
      'SageMaker',
      'Vertex AI',
    ]),
  ]),
  domain('mobile', 'Mobile Development', [
    group('mobile-android', 'Android', ['Kotlin', 'Java', 'Jetpack Compose']),
    group('mobile-ios', 'iOS', ['Swift', 'SwiftUI', 'Objective-C']),
    group('mobile-cross-platform', 'Cross Platform', [
      'React Native',
      'Flutter',
      'Kotlin Multiplatform',
      'Ionic',
      'Capacitor',
    ]),
    group('mobile-backend', 'Mobile Backend Services', [
      'Firebase',
      'Supabase',
      'Appwrite',
    ]),
  ]),
  domain('data-engineering', 'Data Engineering', [
    group('de-big-data', 'Big Data', ['Hadoop', 'Apache Spark', 'Apache Flink']),
    group('de-streaming', 'Streaming', [
      'Kafka',
      'Pulsar',
      'RabbitMQ',
      'Redpanda',
    ]),
    group('de-workflow', 'Workflow Orchestration', [
      'Apache Airflow',
      'Dagster',
      'Prefect',
    ]),
    group('de-warehouses', 'Warehouses', [
      'Snowflake',
      'BigQuery',
      'Redshift',
      'Databricks',
    ]),
  ]),
  domain('cybersecurity', 'Cybersecurity', [
    group('sec-areas', 'Security Areas', [
      'Application Security',
      'Network Security',
      'Cloud Security',
      'Endpoint Security',
      'IAM',
    ]),
    group('sec-tools', 'Security Tools', [
      'Burp Suite',
      'Metasploit',
      'Wireshark',
      'OWASP ZAP',
      'Nessus',
    ]),
    group('sec-concepts', 'Security Concepts', [
      'Encryption',
      'Hashing',
      'MFA',
      'Zero Trust',
      'SIEM',
      'Threat Modeling',
    ]),
  ]),
  domain('system-design', 'System Design & Distributed Systems', [
    group('sd-scalability', 'Scalability', [
      'Horizontal Scaling',
      'Vertical Scaling',
      'Auto Scaling',
      'Load Balancing',
    ]),
    group('sd-distributed', 'Distributed Systems Concepts', [
      'CAP Theorem',
      'Consensus Algorithms',
      'Replication',
      'Sharding',
      'Event Sourcing',
    ]),
    group('sd-messaging', 'Messaging Systems', [
      'Kafka',
      'RabbitMQ',
      'NATS',
      'ActiveMQ',
      'SQS',
    ]),
    group('sd-caching', 'Caching', ['Redis', 'Memcached', 'CDN Caching']),
  ]),
  domain('web3', 'Web3 & Blockchain', [
    group('web3-platforms', 'Blockchain Platforms', [
      'Ethereum',
      'Solana',
      'Polygon',
    ]),
    group('web3-contracts', 'Smart Contracts', ['Solidity', 'Rust (Solana)']),
    group('web3-tools', 'Web3 Tools', [
      'Hardhat',
      'Foundry',
      'Web3.js',
      'Ethers.js',
    ]),
  ]),
  domain('game-dev', 'Game Development', [
    group('game-engines', 'Engines', ['Unity', 'Unreal Engine', 'Godot']),
    group('game-graphics', 'Graphics APIs', ['DirectX', 'Vulkan', 'OpenGL']),
  ]),
  domain('ar-vr-xr', 'AR / VR / XR', [
    group('xr-platforms', 'AR / VR / XR', [
      'Unity XR',
      'Unreal XR',
      'ARKit',
      'ARCore',
      'OpenXR',
    ]),
  ]),
  domain('iot-embedded', 'IoT & Embedded', [
    group('iot-hardware', 'Hardware', ['Raspberry Pi', 'Arduino', 'ESP32']),
    group('iot-protocols', 'Protocols', ['MQTT', 'Zigbee', 'LoRaWAN']),
  ]),
  domain('desktop', 'Desktop Development', [
    group('desktop-cross', 'Cross Platform', ['Electron', 'Tauri', 'Qt']),
    group('desktop-native', 'Native Desktop', ['WPF', 'WinForms', 'Cocoa']),
  ]),
  domain('engineering-practices', 'Software Engineering Practices', [
    group('eng-vcs', 'Version Control', ['Git', 'GitHub', 'GitLab', 'Bitbucket']),
    group('eng-agile', 'Agile', ['Scrum', 'Kanban', 'SAFe']),
    group('eng-patterns', 'Design Patterns', [
      'Factory',
      'Singleton',
      'Observer',
      'Repository',
      'CQRS',
    ]),
    group('eng-docs', 'Documentation', [
      'Swagger/OpenAPI',
      'Storybook',
      'ADRs',
      'Docusaurus',
    ]),
  ]),
  domain('testing-qa', 'Testing & QA', [
    group('qa-unit', 'Unit Testing', ['Jest', 'Mocha', 'JUnit', 'PyTest']),
    group('qa-integration', 'Integration Testing', ['Supertest', 'Postman']),
    group('qa-e2e', 'E2E Testing', ['Playwright', 'Cypress', 'Selenium']),
    group('qa-performance', 'Performance Testing', ['JMeter', 'K6', 'Locust']),
  ]),
];

export const MAX_ASSESSMENT_SECTIONS = 10;

export function flattenTaxonomySkills(): TaxonomySkill[] {
  const out: TaxonomySkill[] = [];
  for (const d of ASSESSMENT_TAXONOMY) {
    for (const g of d.groups) {
      for (const s of g.skills) {
        out.push(s);
      }
    }
  }
  return out;
}
