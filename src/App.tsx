import { useEffect, useMemo, useState } from "react";

type ApiHealth = {
  ok: boolean;
  service: string;
  supabase?: {
    configured: boolean;
    projectRef: string | null;
    missing: string[];
  };
};

type DbHealth = {
  ok: boolean;
  message: string;
  projectRef?: string | null;
  missing?: string[];
  tableCheck?: {
    table: string;
    ok: boolean;
    error?: string;
  } | null;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function StatusPill({ ok }: { ok: boolean }) {
  return <span className={ok ? "pill pill-ok" : "pill pill-warn"}>{ok ? "已连接" : "待配置"}</span>;
}

function App() {
  const [apiHealth, setApiHealth] = useState<LoadState<ApiHealth>>({ status: "loading" });
  const [dbHealth, setDbHealth] = useState<LoadState<DbHealth>>({ status: "loading" });

  const refresh = useMemo(
    () => async () => {
      setApiHealth({ status: "loading" });
      setDbHealth({ status: "loading" });

      try {
        const health = await fetchJson<ApiHealth>("/health");
        setApiHealth({ status: "success", data: health });
      } catch (error) {
        setApiHealth({
          status: "error",
          message: error instanceof Error ? error.message : "API health check failed",
        });
      }

      try {
        const database = await fetchJson<DbHealth>("/health/db");
        setDbHealth({ status: "success", data: database });
      } catch (error) {
        setDbHealth({
          status: "error",
          message: error instanceof Error ? error.message : "Database health check failed",
        });
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const configured =
    apiHealth.status === "success" ? Boolean(apiHealth.data.supabase?.configured) : false;

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Cultivation Game</p>
          <h1>数据库连接面板</h1>
          <p className="summary">
            前端通过后端读取 Supabase 状态，真实 service role key 只保存在后端环境变量中。
          </p>
        </div>
        <button className="refresh" onClick={() => void refresh()}>
          刷新
        </button>
      </section>

      <section className="status-grid">
        <article className="status-card">
          <div className="status-header">
            <h2>后端 API</h2>
            {apiHealth.status === "success" && <StatusPill ok={apiHealth.data.ok} />}
          </div>
          {apiHealth.status === "loading" && <p>正在检查后端服务...</p>}
          {apiHealth.status === "error" && <p className="error">{apiHealth.message}</p>}
          {apiHealth.status === "success" && (
            <dl>
              <div>
                <dt>Service</dt>
                <dd>{apiHealth.data.service}</dd>
              </div>
              <div>
                <dt>Supabase</dt>
                <dd>{configured ? "配置完整" : "缺少环境变量"}</dd>
              </div>
              <div>
                <dt>Project Ref</dt>
                <dd>{apiHealth.data.supabase?.projectRef ?? "未读取到"}</dd>
              </div>
            </dl>
          )}
        </article>

        <article className="status-card">
          <div className="status-header">
            <h2>Supabase</h2>
            {dbHealth.status === "success" && <StatusPill ok={dbHealth.data.ok} />}
          </div>
          {dbHealth.status === "loading" && <p>正在检查数据库连接...</p>}
          {dbHealth.status === "error" && <p className="error">{dbHealth.message}</p>}
          {dbHealth.status === "success" && (
            <dl>
              <div>
                <dt>状态</dt>
                <dd>{dbHealth.data.message}</dd>
              </div>
              <div>
                <dt>Project Ref</dt>
                <dd>{dbHealth.data.projectRef ?? "未读取到"}</dd>
              </div>
              {dbHealth.data.tableCheck && (
                <div>
                  <dt>表检查</dt>
                  <dd>
                    {dbHealth.data.tableCheck.table}:{" "}
                    {dbHealth.data.tableCheck.ok ? "正常" : dbHealth.data.tableCheck.error}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </article>
      </section>

      <section className="next-steps">
        <h2>本地配置</h2>
        <ol>
          <li>后端复制 .env.example 为 .env。</li>
          <li>填入 SUPABASE_SERVICE_ROLE_KEY。</li>
          <li>启动后端 npm run dev，再启动前端 npm run dev。</li>
        </ol>
      </section>
    </main>
  );
}

export default App;
