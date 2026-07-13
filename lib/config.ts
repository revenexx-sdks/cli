import os from "os";
import fs from "fs";
import _path from "path";
import process from "process";
import type { z } from "zod";
import type {
  BucketType,
  CollectionType,
  FunctionType,
  ConfigType,
  SettingsType,
  SiteType,
  TableType,
  TeamType,
  TopicType,
} from "./commands/config.js";
import {
  SiteSchema,
  FunctionSchema,
  DatabaseSchema,
  CollectionSchema,
  AttributeSchema,
  IndexSchema,
  TableSchema,
  ColumnSchema,
  IndexTableSchema,
  TopicSchema,
  TeamSchema,
  BucketSchema,
} from "./commands/config.js";
import type {
  SessionData,
  ConfigData,
  Entity,
  GlobalConfigData,
} from "./types.js";
import { EXECUTABLE_NAME } from "./constants.js";
import { JSONBig } from "./json.js";

/**
 * Extract keys from a Zod object schema.
 * Handles both plain ZodObject and ZodEffects (schemas with refinements).
 */
function getSchemaKeys(schema: z.ZodTypeAny): Set<string> {
  // For ZodEffects (created by .refine(), .superRefine(), .transform())
  if ("def" in schema && "schema" in (schema.def as any)) {
    return getSchemaKeys((schema.def as any).schema);
  }
  // For ZodObject
  if ("shape" in schema) {
    return new Set(Object.keys((schema as any).shape));
  }
  return new Set();
}

const KeysVars = new Set(["key", "value"]);
const KeysSite = getSchemaKeys(SiteSchema);
const KeysFunction = getSchemaKeys(FunctionSchema);
const KeysDatabase = getSchemaKeys(DatabaseSchema);
const KeysCollection = getSchemaKeys(CollectionSchema);
const KeysTable = getSchemaKeys(TableSchema);
const KeysStorage = getSchemaKeys(BucketSchema);
const KeysTopics = getSchemaKeys(TopicSchema);
const KeysTeams = getSchemaKeys(TeamSchema);
const KeysAttributes = getSchemaKeys(AttributeSchema);
const KeysColumns = getSchemaKeys(ColumnSchema);
const KeyIndexes = getSchemaKeys(IndexSchema);
const KeyIndexesColumns = getSchemaKeys(IndexTableSchema);

const CONFIG_KEY_ORDER = [
  "projectId",
  "projectName",
  "endpoint",
  "settings",
  "functions",
  "sites",
  "databases",
  "collections",
  "tablesDB",
  "tables",
  "buckets",
  "teams",
  "topics",
  "messages",
];

function orderConfigKeys<T extends Record<string, any>>(data: T): T {
  const ordered: Record<string, any> = {};

  for (const key of CONFIG_KEY_ORDER) {
    if (key in data) {
      ordered[key] = data[key];
    }
  }

  for (const key of Object.keys(data)) {
    if (!(key in ordered)) {
      ordered[key] = data[key];
    }
  }

  return ordered as T;
}

function whitelistKeys<T = any>(
  value: T,
  keys: Set<string>,
  nestedKeys: Record<string, Set<string>> = {},
): T {
  if (Array.isArray(value)) {
    const newValue: any[] = [];

    for (const item of value) {
      newValue.push(whitelistKeys(item, keys, nestedKeys));
    }

    return newValue as T;
  }

  const newValue: Record<string, any> = {};
  Object.keys(value as any).forEach((key) => {
    if (keys.has(key)) {
      if (nestedKeys[key]) {
        newValue[key] = whitelistKeys((value as any)[key], nestedKeys[key]);
      } else {
        newValue[key] = (value as any)[key];
      }
    }
  });
  return newValue as T;
}

class Config<T extends ConfigData = ConfigData> {
  readonly path: string;
  protected data: T;

  constructor(path: string) {
    this.path = path;
    this.data = {} as T;
    this.read();
  }

  read(): void {
    try {
      const file = fs.readFileSync(this.path).toString();
      this.data = JSONBig.parse(file);
    } catch (_e) {
      this.data = {} as T;
    }
  }

  write(): void {
    this.writeSecure(JSONBig.stringify(this.data, null, 4));
  }

  /**
   * Persist `serialized` to `this.path` with owner-only permissions. The
   * containing directory is created `0o700` and the file `0o600`; because
   * `writeFileSync`'s `mode` only applies when the file is *created*, the
   * mode is reasserted with `chmodSync` on every write to repair drift on
   * files that predate this hardening or were written under a loose umask.
   */
  protected writeSecure(serialized: string): void {
    const dir = _path.dirname(this.path);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(this.path, serialized, { mode: 0o600 });
    try {
      fs.chmodSync(this.path, 0o600);
    } catch {
      // Best-effort: non-POSIX filesystems may not support chmod.
    }
  }

  get<K extends keyof T>(key: K): T[K];
  get(key: string): any {
    return this.data[key as keyof T];
  }

  set<K extends keyof T>(key: K, value: T[K]): void;
  set(key: string, value: any): void {
    (this.data as any)[key] = value;
    this.write();
  }

  delete(key: string): void {
    delete (this.data as any)[key];
    this.write();
  }

  clear(): void {
    this.data = {} as T;
    this.write();
  }

  has(key: string): boolean {
    return this.data[key as keyof T] !== undefined;
  }

  keys(): string[] {
    return Object.keys(this.data);
  }

  values(): unknown[] {
    return Object.values(this.data);
  }

  toString(): string {
    return JSONBig.stringify(this.data, null, 4);
  }

  protected _getDBEntities(entityType: string): Entity[] {
    if (!this.has(entityType)) {
      return [];
    }
    return this.get(entityType) as Entity[];
  }

  protected _getDBEntity(
    entityType: string,
    $id: string,
  ): Entity | Record<string, never> {
    if (!this.has(entityType)) {
      return {};
    }

    const entities = this.get(entityType) as Entity[];
    for (let i = 0; i < entities.length; i++) {
      if (entities[i]["$id"] == $id) {
        return entities[i];
      }
    }

    return {};
  }

  protected _addDBEntity(
    entityType: string,
    props: Entity,
    keysSet: Set<string>,
    nestedKeys: Record<string, Set<string>> = {},
  ): void {
    props = whitelistKeys(props, keysSet, nestedKeys);

    if (!this.has(entityType)) {
      (this.set as (key: string, value: Entity[]) => void)(entityType, []);
    }

    const entities = this.get(entityType) as Entity[];
    for (let i = 0; i < entities.length; i++) {
      if (entities[i]["$id"] == props["$id"]) {
        entities[i] = props;
        (this.set as (key: string, value: Entity[]) => void)(
          entityType,
          entities,
        );
        return;
      }
    }
    entities.push(props);
    (this.set as (key: string, value: Entity[]) => void)(entityType, entities);
  }
}

class Local extends Config<ConfigType> {
  static CONFIG_FILE_PATH = `${EXECUTABLE_NAME}.config.json`;
  static CONFIG_FILE_PATH_LEGACY = `${EXECUTABLE_NAME}.json`;
  configDirectoryPath = "";

  constructor(
    path: string = Local.CONFIG_FILE_PATH,
    legacyPath: string = Local.CONFIG_FILE_PATH_LEGACY,
  ) {
    let absolutePath =
      Local.findConfigFile(path) || Local.findConfigFile(legacyPath);

    if (!absolutePath) {
      absolutePath = `${process.cwd()}/${path}`;
    }

    super(absolutePath);
    this.configDirectoryPath = _path.dirname(absolutePath);
  }

  write(): void {
    this.writeSecure(JSONBig.stringify(orderConfigKeys(this.data), null, 4));
  }

  static findConfigFile(filename: string): string | null {
    let currentPath = process.cwd();

    while (true) {
      const filePath = `${currentPath}/${filename}`;

      if (fs.existsSync(filePath)) {
        return filePath;
      }

      const parentDirectory = _path.dirname(currentPath);
      if (parentDirectory === currentPath) {
        break;
      }
      currentPath = parentDirectory;
    }

    return null;
  }

  getDirname(): string {
    return _path.dirname(this.path);
  }

  getEndpoint(): string {
    return this.get("endpoint") || "";
  }

  setEndpoint(endpoint: string): void {
    this.set("endpoint", endpoint);
  }

  getSites(): SiteType[] {
    if (!this.has("sites")) {
      return [];
    }
    return this.get("sites") ?? [];
  }

  getSite($id: string): SiteType | Record<string, never> {
    if (!this.has("sites")) {
      return {};
    }

    const sites = this.get("sites") ?? [];
    for (let i = 0; i < sites.length; i++) {
      if (sites[i]["$id"] == $id) {
        return sites[i];
      }
    }

    return {};
  }

  addSite(props: SiteType): void {
    props = whitelistKeys(props, KeysSite, {
      vars: KeysVars,
    });

    if (!this.has("sites")) {
      this.set("sites", []);
    }

    const sites = this.get("sites") ?? [];
    for (let i = 0; i < sites.length; i++) {
      if (sites[i]["$id"] == props["$id"]) {
        sites[i] = {
          ...sites[i],
          ...props,
        };
        this.set("sites", sites);
        return;
      }
    }

    sites.push(props);
    this.set("sites", sites);
  }

  getFunctions(): FunctionType[] {
    if (!this.has("functions")) {
      return [];
    }
    return this.get("functions") ?? [];
  }

  getFunction($id: string): FunctionType | Record<string, never> {
    if (!this.has("functions")) {
      return {};
    }

    const functions = this.get("functions") ?? [];
    for (let i = 0; i < functions.length; i++) {
      if (functions[i]["$id"] == $id) {
        return functions[i];
      }
    }

    return {};
  }

  addFunction(props: FunctionType): void {
    props = whitelistKeys(props, KeysFunction, {
      vars: KeysVars,
    });

    if (!this.has("functions")) {
      this.set("functions", []);
    }

    const functions = this.get("functions") ?? [];
    for (let i = 0; i < functions.length; i++) {
      if (functions[i]["$id"] == props["$id"]) {
        functions[i] = {
          ...functions[i],
          ...props,
        };
        this.set("functions", functions);
        return;
      }
    }

    functions.push(props);
    this.set("functions", functions);
  }

  getCollections(): CollectionType[] {
    if (!this.has("collections")) {
      return [];
    }
    return this.get("collections") ?? [];
  }

  getCollection($id: string): CollectionType | Record<string, never> {
    if (!this.has("collections")) {
      return {};
    }

    const collections = this.get("collections") ?? [];
    for (let i = 0; i < collections.length; i++) {
      if (collections[i]["$id"] == $id) {
        return collections[i];
      }
    }

    return {};
  }

  addCollection(props: CollectionType): void {
    props = whitelistKeys(props, KeysCollection, {
      attributes: KeysAttributes,
      indexes: KeyIndexes,
    });

    if (!this.has("collections")) {
      this.set("collections", []);
    }

    const collections = this.get("collections") ?? [];
    for (let i = 0; i < collections.length; i++) {
      if (
        collections[i]["$id"] == props["$id"] &&
        collections[i]["databaseId"] == props["databaseId"]
      ) {
        collections[i] = props;
        this.set("collections", collections);
        return;
      }
    }
    collections.push(props);
    this.set("collections", collections);
  }

  getTables(): TableType[] {
    if (!this.has("tables")) {
      return [];
    }
    return this.get("tables") ?? [];
  }

  getTable($id: string): TableType | Record<string, never> {
    if (!this.has("tables")) {
      return {};
    }

    const tables = this.get("tables") ?? [];
    for (let i = 0; i < tables.length; i++) {
      if (tables[i]["$id"] == $id) {
        return tables[i];
      }
    }

    return {};
  }

  addTable(props: TableType): void {
    props = whitelistKeys(props, KeysTable, {
      columns: KeysColumns,
      indexes: KeyIndexesColumns,
    });

    if (!this.has("tables")) {
      this.set("tables", []);
    }

    const tables = this.get("tables") ?? [];
    for (let i = 0; i < tables.length; i++) {
      if (
        tables[i]["$id"] == props["$id"] &&
        tables[i]["databaseId"] == props["databaseId"]
      ) {
        tables[i] = props;
        this.set("tables", tables);
        return;
      }
    }
    tables.push(props);
    this.set("tables", tables);
  }

  getBuckets(): BucketType[] {
    if (!this.has("buckets")) {
      return [];
    }
    return this.get("buckets") ?? [];
  }

  getBucket($id: string): BucketType | Record<string, never> {
    if (!this.has("buckets")) {
      return {};
    }

    const buckets = this.get("buckets") ?? [];
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i]["$id"] == $id) {
        return buckets[i];
      }
    }

    return {};
  }

  addBucket(props: BucketType): void {
    props = whitelistKeys(props, KeysStorage);

    if (!this.has("buckets")) {
      this.set("buckets", []);
    }

    const buckets = this.get("buckets") ?? [];
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i]["$id"] == props["$id"]) {
        buckets[i] = props;
        this.set("buckets", buckets);
        return;
      }
    }
    buckets.push(props);
    this.set("buckets", buckets);
  }

  getMessagingTopics(): TopicType[] {
    if (!this.has("topics")) {
      return [];
    }
    return this.get("topics") ?? [];
  }

  getMessagingTopic($id: string): TopicType | Record<string, never> {
    if (!this.has("topics")) {
      return {};
    }

    const topics = this.get("topics") ?? [];
    for (let i = 0; i < topics.length; i++) {
      if (topics[i]["$id"] == $id) {
        return topics[i];
      }
    }

    return {};
  }

  addMessagingTopic(props: TopicType): void {
    props = whitelistKeys(props, KeysTopics);

    if (!this.has("topics")) {
      this.set("topics", []);
    }

    const topics = this.get("topics") ?? [];
    for (let i = 0; i < topics.length; i++) {
      if (topics[i]["$id"] === props["$id"]) {
        topics[i] = props;
        this.set("topics", topics);
        return;
      }
    }
    topics.push(props);
    this.set("topics", topics);
  }

  getTablesDBs(): any[] {
    return this._getDBEntities("tablesDB");
  }

  getTablesDB($id: string): any {
    return this._getDBEntity("tablesDB", $id);
  }

  addTablesDB(props: any): void {
    this._addDBEntity("tablesDB", props, KeysDatabase);
  }

  getDatabases(): any[] {
    return this._getDBEntities("databases");
  }

  getDatabase($id: string): any {
    return this._getDBEntity("databases", $id);
  }

  addDatabase(props: any): void {
    this._addDBEntity("databases", props, KeysDatabase);
  }

  getTeams(): TeamType[] {
    if (!this.has("teams")) {
      return [];
    }
    return this.get("teams") ?? [];
  }

  getTeam($id: string): TeamType | Record<string, never> {
    if (!this.has("teams")) {
      return {};
    }

    const teams = this.get("teams") ?? [];
    for (let i = 0; i < teams.length; i++) {
      if (teams[i]["$id"] == $id) {
        return teams[i];
      }
    }

    return {};
  }

  addTeam(props: TeamType): void {
    props = whitelistKeys(props, KeysTeams);
    if (!this.has("teams")) {
      this.set("teams", []);
    }

    const teams = this.get("teams") ?? [];
    for (let i = 0; i < teams.length; i++) {
      if (teams[i]["$id"] == props["$id"]) {
        teams[i] = props;
        this.set("teams", teams);
        return;
      }
    }
    teams.push(props);
    this.set("teams", teams);
  }

  getProject(): {
    projectId?: string;
    projectName?: string;
    projectSettings?: SettingsType;
  } {
    if (!this.has("projectId")) {
      return {};
    }

    return {
      projectId: this.get("projectId"),
      projectName: this.get("projectName"),
      projectSettings: this.get("settings"),
    };
  }

  setProject(projectId: string, projectName: string = ""): void {
    this.set("projectId", projectId);

    if (projectName !== "") {
      this.set("projectName", projectName);
    }
  }
}

class Global extends Config<GlobalConfigData> {
  static CONFIG_FILE_PATH = `.${EXECUTABLE_NAME}/prefs.json`;

  static PREFERENCE_CURRENT = "current" as const;
  static PREFERENCE_ENDPOINT = "endpoint" as const;
  static PREFERENCE_EMAIL = "email" as const;
  static PREFERENCE_SELF_SIGNED = "selfSigned" as const;
  static PREFERENCE_COOKIE = "cookie" as const;
  static PREFERENCE_PROJECT = "project" as const;
  static PREFERENCE_KEY = "key" as const;
  static PREFERENCE_LOCALE = "locale" as const;
  static PREFERENCE_MODE = "mode" as const;
  static PREFERENCE_JWT = "jwt" as const;
  static PREFERENCE_REFRESH_TOKEN = "refreshToken" as const;
  static PREFERENCE_JWT_EXPIRES = "jwtExpiresAt" as const;
  static PREFERENCE_AUTH_METHOD = "authMethod" as const;
  static PREFERENCE_ALIASES = "aliases" as const;
  static PREFERENCE_SENSITIVE_TENANTS = "sensitiveTenants" as const;

  static IGNORE_ATTRIBUTES: readonly string[] = [
    Global.PREFERENCE_CURRENT,
    Global.PREFERENCE_SELF_SIGNED,
    Global.PREFERENCE_ENDPOINT,
    Global.PREFERENCE_COOKIE,
    Global.PREFERENCE_PROJECT,
    Global.PREFERENCE_KEY,
    Global.PREFERENCE_LOCALE,
    Global.PREFERENCE_MODE,
    Global.PREFERENCE_JWT,
    Global.PREFERENCE_REFRESH_TOKEN,
    Global.PREFERENCE_JWT_EXPIRES,
    Global.PREFERENCE_AUTH_METHOD,
    Global.PREFERENCE_ALIASES,
    Global.PREFERENCE_SENSITIVE_TENANTS,
  ];

  static MODE_ADMIN = "admin";
  static MODE_DEFAULT = "default";

  static PROJECT_CONSOLE = "console";

  constructor(path: string = Global.CONFIG_FILE_PATH) {
    const homeDir = os.homedir();
    super(`${homeDir}/${path}`);
  }

  write(): void {
    super.write();
    // prefs.json holds the JWT, refresh token, API key and session cookie, so
    // lock down the credential directory itself too — reasserted on every
    // write to repair a `~/.revenexx` created world-traversable under a loose
    // umask before this hardening.
    try {
      fs.chmodSync(_path.dirname(this.path), 0o700);
    } catch {
      // Best-effort: non-POSIX filesystems may not support chmod.
    }
  }

  getCurrentSession(): string {
    if (!this.has(Global.PREFERENCE_CURRENT)) {
      return "";
    }
    return this.get(Global.PREFERENCE_CURRENT);
  }

  setCurrentSession(session: string): void {
    if (session !== undefined) {
      this.set(Global.PREFERENCE_CURRENT, session);
    }
  }

  getSessionIds(): string[] {
    return Object.keys(this.data).filter(
      (key) => !Global.IGNORE_ATTRIBUTES.includes(key),
    );
  }

  getSessions(): Array<{ id: string; endpoint: string; email: string }> {
    const sessions = Object.keys(this.data).filter(
      (key) => !Global.IGNORE_ATTRIBUTES.includes(key),
    );
    const current = this.getCurrentSession();

    const sessionMap = new Map<
      string,
      { id: string; endpoint: string; email: string }
    >();

    sessions.forEach((sessionId) => {
      const sessionData = (this.data as any)[sessionId];
      const email = sessionData[Global.PREFERENCE_EMAIL] ?? "";
      const endpoint = sessionData[Global.PREFERENCE_ENDPOINT] ?? "";
      const key = `${email}|${endpoint}`;

      if (sessionId === current || !sessionMap.has(key)) {
        sessionMap.set(key, {
          id: sessionId,
          endpoint,
          email,
        });
      }
    });

    return Array.from(sessionMap.values());
  }

  addSession(session: string, data: SessionData): void {
    this.set(session as any, data as any);
  }

  removeSession(session: string): void {
    this.delete(session);
  }

  getEmail(): string {
    if (!this.hasFrom(Global.PREFERENCE_EMAIL)) {
      return "";
    }

    return this.getFrom(Global.PREFERENCE_EMAIL);
  }

  setEmail(email: string): void {
    this.setTo(Global.PREFERENCE_EMAIL, email);
  }

  getEndpoint(): string {
    if (!this.hasFrom(Global.PREFERENCE_ENDPOINT)) {
      return "";
    }

    return this.getFrom(Global.PREFERENCE_ENDPOINT);
  }

  setEndpoint(endpoint: string): void {
    this.setTo(Global.PREFERENCE_ENDPOINT, endpoint);
  }

  getSelfSigned(): boolean {
    if (!this.hasFrom(Global.PREFERENCE_SELF_SIGNED)) {
      return false;
    }
    return this.getFrom(Global.PREFERENCE_SELF_SIGNED);
  }

  setSelfSigned(selfSigned: boolean): void {
    this.setTo(Global.PREFERENCE_SELF_SIGNED, selfSigned);
  }

  getCookie(): string {
    if (!this.hasFrom(Global.PREFERENCE_COOKIE)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_COOKIE);
  }

  setCookie(cookie: string): void {
    this.setTo(Global.PREFERENCE_COOKIE, cookie);
  }

  getProject(): string {
    if (!this.hasFrom(Global.PREFERENCE_PROJECT)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_PROJECT);
  }

  setProject(project: string): void {
    this.setTo(Global.PREFERENCE_PROJECT, project);
  }

  getKey(): string {
    if (!this.hasFrom(Global.PREFERENCE_KEY)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_KEY);
  }

  setKey(key: string): void {
    this.setTo(Global.PREFERENCE_KEY, key);
  }

  getJWT(): string {
    if (!this.hasFrom(Global.PREFERENCE_JWT)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_JWT);
  }

  setJWT(jwt: string): void {
    this.setTo(Global.PREFERENCE_JWT, jwt);
  }

  getRefreshToken(): string {
    if (!this.hasFrom(Global.PREFERENCE_REFRESH_TOKEN)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_REFRESH_TOKEN);
  }

  setRefreshToken(refreshToken: string): void {
    this.setTo(Global.PREFERENCE_REFRESH_TOKEN, refreshToken);
  }

  getJwtExpires(): number {
    if (!this.hasFrom(Global.PREFERENCE_JWT_EXPIRES)) {
      return 0;
    }
    return this.getFrom(Global.PREFERENCE_JWT_EXPIRES);
  }

  setJwtExpires(expiresAt: number): void {
    this.setTo(Global.PREFERENCE_JWT_EXPIRES, expiresAt);
  }

  getAuthMethod(): string {
    if (!this.hasFrom(Global.PREFERENCE_AUTH_METHOD)) {
      return "";
    }
    return this.getFrom(Global.PREFERENCE_AUTH_METHOD);
  }

  setAuthMethod(authMethod: string): void {
    this.setTo(Global.PREFERENCE_AUTH_METHOD, authMethod);
  }

  /**
   * User-defined command aliases (git-style), keyed by alias name. These are
   * machine-wide rather than session-scoped, so they live at the top level of
   * prefs.json (and are excluded from the session list via IGNORE_ATTRIBUTES).
   */
  getAliases(): Record<string, string> {
    const aliases = this.get(Global.PREFERENCE_ALIASES) as
      | Record<string, string>
      | undefined;
    return aliases ?? {};
  }

  setAlias(name: string, expansion: string): void {
    const aliases = this.getAliases();
    aliases[name] = expansion;
    this.set(Global.PREFERENCE_ALIASES, aliases);
  }

  removeAlias(name: string): boolean {
    const aliases = this.getAliases();
    if (!(name in aliases)) {
      return false;
    }
    delete aliases[name];
    this.set(Global.PREFERENCE_ALIASES, aliases);
    return true;
  }

  /**
   * Tenant slugs the user has flagged as sensitive, so the context banner
   * (lib/parser.ts) renders its prominent production warning for them even
   * when the endpoint alone wouldn't trigger it. Machine-wide, top-level.
   */
  getSensitiveTenants(): string[] {
    const tenants = this.get(Global.PREFERENCE_SENSITIVE_TENANTS) as
      | string[]
      | undefined;
    return Array.isArray(tenants) ? tenants : [];
  }

  setSensitiveTenants(tenants: string[]): void {
    // Normalise: trim, drop blanks, de-duplicate, keep a stable order.
    const cleaned = Array.from(
      new Set(tenants.map((t) => t.trim()).filter((t) => t !== "")),
    );
    this.set(Global.PREFERENCE_SENSITIVE_TENANTS, cleaned);
  }

  hasFrom(key: string): boolean {
    const current = this.getCurrentSession();

    if (current) {
      const config = this.get(current as any) ?? {};

      return (config as any)[key] !== undefined;
    }
    return false;
  }

  getFrom(key: string): any {
    const current = this.getCurrentSession();

    if (current) {
      const config = this.get(current as any) ?? {};

      return (config as any)[key];
    }
  }

  setTo(key: string, value: any): void {
    const current = this.getCurrentSession();

    if (current) {
      const config = this.get(current as any);

      (config as any)[key] = value;
      this.write();
    }
  }
}

export const localConfig = new Local();
export const globalConfig = new Global();
export {
  KeysAttributes,
  KeysSite,
  KeysFunction,
  KeysTopics,
  KeysStorage,
  KeysTeams,
  KeysCollection,
  KeysTable,
  whitelistKeys,
};
