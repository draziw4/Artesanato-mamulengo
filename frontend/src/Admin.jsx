import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8010`;

const API = `${API_BASE.replace(/\/$/, "")}/api`;
const emptyProduct = {
  name: "",
  category_id: "",
  collection: "",
  price: "",
  installments: 1,
  material: "",
  dimensions: "",
  description: "",
  image: "",
  tag: "",
  featured: false,
  active: true,
  stock: 0,
  track_stock: false,
};
const money = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const request = (url, options = {}) =>
  fetch(`${API}${url}`, { credentials: "include", ...options });
const imageUrl = (url) =>
  url?.startsWith("/uploads/")
    ? `${API_BASE.replace(/\/$/, "")}${url}`
    : url;

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@casamamulengo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });
      const data = await response.json();
      if (response.status === 428) {
        setNeedsOtp(true);
        throw new Error(data.detail);
      }
      if (!response.ok) throw new Error(data.detail);
      onLogin(data);
    } catch (loginError) {
      setError(loginError.message || "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <section className="admin-login-card">
        <a className="brand" href="/">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <span className="eyebrow">Área reservada</span>
        <h1>Administração da oficina</h1>
        <p>Entre para cuidar do catálogo, das fotografias e dos pedidos.</p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="Sua senha administrativa"
            />
          </label>
          {needsOtp && (
            <label>
              Código de autenticação
              <input
                inputMode="numeric"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                placeholder="000000"
              />
            </label>
          )}
          {error && <div className="admin-alert error">{error}</div>}
          <button className="primary full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
        <a className="admin-back" href="/">
          ← Voltar para a loja
        </a>
      </section>
    </div>
  );
}

const CONTENT_LABELS = {
  announcement: "Aviso promocional",
  hero: "Banner principal",
  catalog: "Chamada do catálogo",
  featured_collection: "Coleção em destaque",
  institutional: "Texto institucional",
  contact: "Informações de contato",
  seo: "SEO básico",
};

function ContentEditor({ content, revisions, onReload }) {
  const [data, setData] = useState(content.data);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => setData(content.data), [content.version, content.data]);
  const update = (section, field, value) =>
    setData((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  const upload = async (section, field, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    const response = await request("/admin/upload", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) return setMessage(result.detail);
    update(section, field, result.url);
  };
  const save = async () => {
    setSaving(true);
    const response = await request("/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? "Rascunho salvo. A loja pública ainda não foi alterada."
        : result.detail,
    );
    setSaving(false);
    if (response.ok) onReload();
  };
  const publish = async () => {
    const response = await request("/admin/content/publish", {
      method: "POST",
    });
    const result = await response.json();
    setMessage(response.ok ? "Conteúdo publicado na loja." : result.detail);
    if (response.ok) onReload();
  };
  const restore = async (revisionId) => {
    const response = await request("/admin/content/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision_id: revisionId }),
    });
    if (response.ok) onReload();
  };
  return (
    <>
      <header className="admin-page-head">
        <div>
          <span className="eyebrow">CMS editorial</span>
          <h1>Conteúdo da loja</h1>
          <p>
            Edite em rascunho, visualize e publique somente quando estiver
            pronto.
          </p>
        </div>
        <div className="content-actions">
          <a className="secondary-button" href="/?preview=1" target="_blank">
            Pré-visualizar ↗
          </a>
          <button className="primary" onClick={publish}>
            Publicar
          </button>
        </div>
      </header>
      <div className="content-status">
        <span
          className={`status-pill ${content.status === "published" ? "published" : "draft"}`}
        >
          {content.status}
        </span>
        <p>Versão {content.version}</p>
      </div>
      {message && <div className="admin-alert">{message}</div>}
      <div className="cms-layout">
        <div className="cms-sections">
          {Object.entries(data).map(([section, fields]) => (
            <section className="cms-card" key={section}>
              <h2>{CONTENT_LABELS[section] || section}</h2>
              <div className="admin-form-grid">
                {Object.entries(fields).map(([field, value]) => {
                  const isImage = ["image", "share_image"].includes(field);
                  const isLong = String(value).length > 90;
                  return (
                    <label className={isLong ? "wide" : ""} key={field}>
                      {field.replaceAll("_", " ")}
                      {isImage ? (
                        <>
                          <div className="cms-image">
                            {value && <img src={imageUrl(value)} alt="" />}
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              upload(section, field, event.target.files?.[0])
                            }
                          />
                        </>
                      ) : typeof value === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(event) =>
                            update(section, field, event.target.checked)
                          }
                        />
                      ) : isLong ? (
                        <textarea
                          rows="3"
                          value={value}
                          onChange={(event) =>
                            update(section, field, event.target.value)
                          }
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(event) =>
                            update(section, field, event.target.value)
                          }
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar rascunho"}
          </button>
        </div>
        <aside className="revision-list">
          <h3>Histórico</h3>
          {revisions.map((item) => (
            <article key={item.id}>
              <strong>Versão {item.version}</strong>
              <small>{new Date(item.created_at).toLocaleString("pt-BR")}</small>
              <button onClick={() => restore(item.id)}>Restaurar</button>
            </article>
          ))}
        </aside>
      </div>
    </>
  );
}

function SecurityPanel({ user, users, auditLogs, onReload }) {
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor",
  });
  const setup2fa = async () =>
    setSetup(await (await request("/auth/2fa/setup", { method: "POST" })).json());
  const enable2fa = async () => {
    const response = await request("/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (response.ok) onReload();
  };
  const createUser = async (event) => {
    event.preventDefault();
    const response = await request("/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (response.ok) {
      setNewUser({ name: "", email: "", password: "", role: "editor" });
      onReload();
    }
  };
  return (
    <>
      <header className="admin-page-head">
        <div>
          <span className="eyebrow">Acesso e rastreabilidade</span>
          <h1>Segurança</h1>
          <p>2FA, papéis de acesso e registro das alterações.</p>
        </div>
      </header>
      <div className="security-grid">
        <section className="cms-card">
          <h2>Autenticação em duas etapas</h2>
          <p>
            {user.two_factor_enabled
              ? "2FA está ativo nesta conta."
              : "Proteja esta conta com um aplicativo autenticador."}
          </p>
          {!user.two_factor_enabled && (
            <>
              {!setup ? (
                <button className="primary" onClick={setup2fa}>
                  Configurar 2FA
                </button>
              ) : (
                <div className="two-factor-setup">
                  <p>
                    Adicione esta chave ao Google Authenticator, 1Password ou
                    Authy:
                  </p>
                  <code>{setup.secret}</code>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Código de 6 dígitos"
                  />
                  <button className="primary" onClick={enable2fa}>
                    Ativar 2FA
                  </button>
                </div>
              )}
            </>
          )}
        </section>
        {user.role === "admin" && (
          <section className="cms-card">
            <h2>Usuários do painel</h2>
            <form onSubmit={createUser} className="admin-form-grid">
              <label>
                Nome
                <input
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser({ ...newUser, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser({ ...newUser, email: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Senha forte
                <input
                  type="password"
                  minLength="12"
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser({ ...newUser, password: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Papel
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser({ ...newUser, role: event.target.value })
                  }
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <button className="primary">Criar usuário</button>
            </form>
            {users.map((item) => (
              <p className="user-row" key={item.id}>
                <strong>{item.name}</strong>
                <span>
                  {item.role} ·{" "}
                  {item.two_factor_enabled ? "2FA ativo" : "sem 2FA"}
                </span>
              </p>
            ))}
          </section>
        )}
      </div>
      {user.role === "admin" && (
        <section className="cms-card audit-card">
          <h2>Registro de atividades</h2>
          {auditLogs.map((log) => (
            <p className="audit-row" key={log.id}>
              <strong>{log.action}</strong>
              <span>
                {log.entity_type} #{log.entity_id}
              </span>
              <small>{new Date(log.created_at).toLocaleString("pt-BR")}</small>
            </p>
          ))}
        </section>
      )}
    </>
  );
}

function ProductForm({ categories, product, onClose, onSaved }) {
  const [form, setForm] = useState(
    product
      ? { ...product }
      : { ...emptyProduct, category_id: categories[0]?.id || "" },
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("image", file);
    try {
      const response = await request("/admin/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      update("image", data.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      price: Number(form.price),
      installments: Number(form.installments),
    };
    try {
      const response = await request(
        product ? `/admin/products/${product.id}` : "/admin/products",
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(data.detail);
      onSaved();
    } catch (saveError) {
      setError(saveError.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal-overlay" onClick={onClose} />
      <form className="admin-product-form" onSubmit={submit}>
        <div className="admin-form-head">
          <div>
            <span className="eyebrow">
              {product ? "Editar peça" : "Nova peça"}
            </span>
            <h2>{product ? product.name : "Adicionar ao catálogo"}</h2>
          </div>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="admin-image-field">
          <div className="admin-image-preview">
            {form.image ? (
              <img src={imageUrl(form.image)} alt="" />
            ) : (
              <span>Nenhuma foto</span>
            )}
          </div>
          <label className="secondary-button">
            {uploading ? "Enviando..." : "Escolher fotografia"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={upload}
              disabled={uploading}
            />
          </label>
          <small>JPG, PNG ou WebP, até 8 MB.</small>
        </div>
        <div className="admin-form-grid">
          <label>
            Nome da peça
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            Categoria
            <select
              value={form.category_id}
              onChange={(event) => update("category_id", event.target.value)}
              required
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Coleção
            <input
              value={form.collection}
              onChange={(event) => update("collection", event.target.value)}
              placeholder="Ex.: Obras de Fé"
            />
          </label>
          <label>
            Selo
            <input
              value={form.tag}
              onChange={(event) => update("tag", event.target.value)}
              placeholder="Ex.: Peça única"
            />
          </label>
          <label>
            Preço
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </label>
          <label>
            Parcelas
            <input
              type="number"
              min="1"
              max="12"
              value={form.installments}
              onChange={(event) => update("installments", event.target.value)}
            />
          </label>
          <label>
            Estoque
            <input
              type="number"
              min="0"
              value={form.stock || 0}
              onChange={(event) => update("stock", Number(event.target.value))}
            />
            <small>
              Use 0 para peças sob encomenda ou estoque não controlado.
            </small>
          </label>
          <label>
            Madeira/material
            <input
              value={form.material}
              onChange={(event) => update("material", event.target.value)}
            />
          </label>
          <label>
            Medidas
            <input
              value={form.dimensions}
              onChange={(event) => update("dimensions", event.target.value)}
            />
          </label>
          <label className="wide">
            Descrição
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows="4"
            />
          </label>
        </div>
        <div className="admin-switches">
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update("featured", event.target.checked)}
            />{" "}
            Destaque na loja
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update("active", event.target.checked)}
            />{" "}
            Produto publicado
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.track_stock}
              onChange={(event) => update("track_stock", event.target.checked)}
            />{" "}
            Controlar estoque
          </label>
        </div>
        {error && <div className="admin-alert error">{error}</div>}
        <div className="admin-form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={saving || uploading}>
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ user, onLogout }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [content, setContent] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [media, setMedia] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionForm, setCollectionForm] = useState({
    id: null,
    name: "",
    description: "",
    image: "",
    featured: false,
    active: true,
  });
  const [editing, setEditing] = useState(undefined);
  const [categoryName, setCategoryName] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (user.two_factor_required && !user.two_factor_enabled) return;
    const calls = [
      request("/admin/products"),
      request("/categories"),
      request("/admin/orders"),
      request("/admin/content"),
      request("/admin/content/revisions"),
      request("/admin/media"),
      request("/admin/collections"),
      ...(user.role === "admin"
        ? [request("/admin/users"), request("/admin/audit")]
        : []),
    ];
    const responses = await Promise.all(calls);
    if (responses.some((response) => response.status === 401))
      return onLogout();
    if (responses.some((response) => response.status === 403)) {
      setTab("security");
      setMessage("Ative o 2FA antes de administrar a loja.");
      return;
    }
    const [
      productsResponse,
      categoriesResponse,
      ordersResponse,
      contentResponse,
      revisionsResponse,
      mediaResponse,
      collectionsResponse,
      usersResponse,
      auditResponse,
    ] = responses;
    setProducts(await productsResponse.json());
    setCategories(await categoriesResponse.json());
    setOrders(await ordersResponse.json());
    setContent(await contentResponse.json());
    setRevisions(await revisionsResponse.json());
    setMedia(await mediaResponse.json());
    setCollections(await collectionsResponse.json());
    if (usersResponse) setUsers(await usersResponse.json());
    if (auditResponse) setAuditLogs(await auditResponse.json());
  };
  useEffect(() => {
    load();
  }, []);

  const addCategory = async (event) => {
    event.preventDefault();
    const response = await request("/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName, description: "" }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.detail);
    setCategoryName("");
    setMessage("Categoria adicionada.");
    load();
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Excluir “${product.name}” definitivamente?`)) return;
    const response = await request(`/admin/products/${product.id}`, {
      method: "DELETE",
    });
    if (response.ok) load();
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    const response = await request(`/admin/categories/${category.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      return setMessage(data.detail);
    }
    setMessage("Categoria excluída.");
    load();
  };

  const saveCollection = async (event) => {
    event.preventDefault();
    const id = collectionForm.id;
    const response = await request(
      id ? `/admin/collections/${id}` : "/admin/collections",
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionForm),
      },
    );
    const data = await response.json();
    if (!response.ok) return setMessage(data.detail);
    setCollectionForm({
      id: null,
      name: "",
      description: "",
      image: "",
      featured: false,
      active: true,
    });
    setMessage(id ? "Coleção atualizada." : "Coleção criada.");
    load();
  };

  const logout = async () => {
    await request("/auth/logout", { method: "POST" });
    onLogout();
  };

  const updateOrderStatus = async (order, status) => {
    const response = await request(`/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Status do pedido atualizado." : data.detail);
    if (response.ok) load();
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand admin-brand" href="/">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <div className="admin-user">
          <span>{user.name.slice(0, 1)}</span>
          <p>
            <strong>{user.name}</strong>
            <small>{user.role === "admin" ? "Administrador" : "Editor"}</small>
          </p>
        </div>
        <nav>
          {!(user.two_factor_required && !user.two_factor_enabled) && (
            <>
              <button
                className={tab === "content" ? "active" : ""}
                onClick={() => setTab("content")}
              >
                Conteúdo <span>CMS</span>
              </button>
              <button
                className={tab === "products" ? "active" : ""}
                onClick={() => setTab("products")}
              >
                Peças <span>{products.length}</span>
              </button>
              <button
                className={tab === "categories" ? "active" : ""}
                onClick={() => setTab("categories")}
              >
                Categorias <span>{categories.length}</span>
              </button>
              <button
                className={tab === "collections" ? "active" : ""}
                onClick={() => setTab("collections")}
              >
                Coleções <span>{collections.length}</span>
              </button>
              <button
                className={tab === "media" ? "active" : ""}
                onClick={() => setTab("media")}
              >
                Mídia <span>{media.length}</span>
              </button>
              <button
                className={tab === "orders" ? "active" : ""}
                onClick={() => setTab("orders")}
              >
                Pedidos <span>{orders.length}</span>
              </button>
            </>
          )}
          <button
            className={tab === "security" ? "active" : ""}
            onClick={() => setTab("security")}
          >
            Segurança <span>2FA</span>
          </button>
        </nav>
        <div className="admin-sidebar-foot">
          <a href="/">Ver loja pública ↗</a>
          <button onClick={logout}>Sair do painel</button>
        </div>
      </aside>
      <main className="admin-main">
        {message && <div className="admin-alert">{message}</div>}
        {user.two_factor_required && !user.two_factor_enabled && (
          <div className="admin-alert error">
            O 2FA é obrigatório antes de editar produtos, pedidos ou conteúdo.
            Configure abaixo usando um aplicativo autenticador.
          </div>
        )}
        {tab === "content" && content && (
          <ContentEditor
            content={content}
            revisions={revisions}
            onReload={load}
          />
        )}
        {tab === "products" && (
          <>
            <header className="admin-page-head">
              <div>
                <span className="eyebrow">Catálogo</span>
                <h1>Peças da oficina</h1>
                <p>
                  Cadastre fotografias, preços e informações que aparecerão na
                  loja.
                </p>
              </div>
              <button className="primary" onClick={() => setEditing(null)}>
                + Nova peça
              </button>
            </header>
            <div className="admin-stats">
              <div>
                <strong>{products.length}</strong>
                <span>peças cadastradas</span>
              </div>
              <div>
                <strong>
                  {products.filter((product) => product.active).length}
                </strong>
                <span>publicadas</span>
              </div>
              <div>
                <strong>
                  {products.filter((product) => product.featured).length}
                </strong>
                <span>em destaque</span>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Peça</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          {product.image ? (
                            <img src={imageUrl(product.image)} alt="" />
                          ) : (
                            <span className="no-photo">Sem foto</span>
                          )}
                          <p>
                            <strong>{product.name}</strong>
                            <small>
                              {product.material || "Material não informado"}
                            </small>
                          </p>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{money(product.price)}</td>
                      <td>
                        <span
                          className={`status-pill ${product.active ? "published" : "draft"}`}
                        >
                          {product.active ? "Publicado" : "Oculto"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setEditing(product)}>
                            Editar
                          </button>
                          <button
                            className="danger"
                            onClick={() => removeProduct(product)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "categories" && (
          <>
            <header className="admin-page-head">
              <div>
                <span className="eyebrow">Organização</span>
                <h1>Categorias</h1>
                <p>Crie as seções usadas para organizar as peças na loja.</p>
              </div>
            </header>
            <form className="category-create" onSubmit={addCategory}>
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Nome da nova categoria"
                required
              />
              <button className="primary">Adicionar categoria</button>
            </form>
            {message && <div className="admin-alert">{message}</div>}
            <div className="category-grid">
              {categories.map((category) => (
                <article key={category.id}>
                  <span>{String(category.count).padStart(2, "0")}</span>
                  <h3>{category.name}</h3>
                  <p>{category.count} produto(s) nesta seção</p>
                  <button
                    disabled={category.count > 0}
                    onClick={() => removeCategory(category)}
                  >
                    {category.count > 0
                      ? "Categoria em uso"
                      : "Excluir categoria"}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "orders" && (
          <>
            <header className="admin-page-head">
              <div>
                <span className="eyebrow">Vendas</span>
                <h1>Pedidos recebidos</h1>
                <p>Acompanhe as encomendas registradas pela loja.</p>
              </div>
            </header>
            {!orders.length ? (
              <div className="admin-empty">
                <span>✦</span>
                <h2>Nenhum pedido ainda</h2>
                <p>Quando uma compra for concluída, ela aparecerá aqui.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Pagamento</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.code}</strong>
                          <small>
                            {new Date(order.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </small>
                        </td>
                        <td>
                          {order.customer_name}
                          <small>{order.customer_email}</small>
                        </td>
                        <td>{order.payment_status.replaceAll("_", " ")}</td>
                        <td>{money(order.total)}</td>
                        <td>
                          <select
                            className="order-status-select"
                            value={order.status}
                            onChange={(event) =>
                              updateOrderStatus(order, event.target.value)
                            }
                          >
                            <option value="awaiting_payment" disabled>
                              Aguardando pagamento
                            </option>
                            <option value="confirmed">Confirmado</option>
                            <option value="preparing">Em preparação</option>
                            <option value="ready_for_pickup">
                              Pronto para retirada
                            </option>
                            <option value="shipped">Enviado</option>
                            <option value="completed">Concluído</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="refunded">Reembolsado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "collections" && (
          <>
            <header className="admin-page-head">
              <div>
                <span className="eyebrow">Curadoria</span>
                <h1>Coleções e destaques</h1>
                <p>
                  Agrupamentos editoriais disponíveis para campanhas e vitrines.
                </p>
              </div>
            </header>
            <form
              className="cms-card collection-form"
              onSubmit={saveCollection}
            >
              <div className="admin-form-grid">
                <label>
                  Nome
                  <input
                    value={collectionForm.name}
                    onChange={(event) =>
                      setCollectionForm({
                        ...collectionForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Imagem (URL)
                  <input
                    value={collectionForm.image}
                    onChange={(event) =>
                      setCollectionForm({
                        ...collectionForm,
                        image: event.target.value,
                      })
                    }
                    placeholder="/uploads/..."
                  />
                </label>
                <label className="wide">
                  Descrição
                  <textarea
                    rows="3"
                    value={collectionForm.description}
                    onChange={(event) =>
                      setCollectionForm({
                        ...collectionForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="admin-switches">
                <label>
                  <input
                    type="checkbox"
                    checked={collectionForm.featured}
                    onChange={(event) =>
                      setCollectionForm({
                        ...collectionForm,
                        featured: event.target.checked,
                      })
                    }
                  />{" "}
                  Coleção em destaque
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={collectionForm.active}
                    onChange={(event) =>
                      setCollectionForm({
                        ...collectionForm,
                        active: event.target.checked,
                      })
                    }
                  />{" "}
                  Coleção ativa
                </label>
              </div>
              <div className="admin-form-actions">
                {collectionForm.id && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setCollectionForm({
                        id: null,
                        name: "",
                        description: "",
                        image: "",
                        featured: false,
                        active: true,
                      })
                    }
                  >
                    Cancelar edição
                  </button>
                )}
                <button className="primary">
                  {collectionForm.id ? "Salvar coleção" : "Nova coleção"}
                </button>
              </div>
            </form>
            {message && <div className="admin-alert">{message}</div>}
            <div className="category-grid">
              {collections.map((item) => (
                <article key={item.id}>
                  {item.image && (
                    <img
                      className="collection-thumb"
                      src={imageUrl(item.image)}
                      alt=""
                    />
                  )}
                  <h3>{item.name}</h3>
                  <p>{item.description || "Sem descrição"}</p>
                  <span
                    className={`status-pill ${item.active ? "published" : "draft"}`}
                  >
                    {item.active ? "Ativa" : "Oculta"}
                  </span>
                  <button onClick={() => setCollectionForm({ ...item })}>
                    Editar coleção
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "media" && (
          <>
            <header className="admin-page-head">
              <div>
                <span className="eyebrow">Biblioteca</span>
                <h1>Imagens processadas</h1>
                <p>
                  Arquivos validados e convertidos automaticamente para formatos
                  modernos.
                </p>
              </div>
            </header>
            <div className="media-grid">
              {media.map((asset) => (
                <article key={asset.id}>
                  <img src={imageUrl(asset.url)} alt={asset.original_name} />
                  <p>
                    <strong>{asset.original_name}</strong>
                    <small>
                      {asset.width} × {asset.height} · WebP
                      {asset.avif_url ? " + AVIF" : ""}
                    </small>
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "security" && (
          <SecurityPanel
            user={user}
            users={users}
            auditLogs={auditLogs}
            onReload={load}
          />
        )}
      </main>
      {editing !== undefined && (
        <ProductForm
          categories={categories}
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setMessage("Produto salvo.");
            load();
          }}
        />
      )}
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    request("/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);
  if (user === undefined)
    return <div className="admin-loading">Preparando o painel...</div>;
  if (!user) return <Login onLogin={setUser} />;
  return <AdminPanel user={user} onLogout={() => setUser(null)} />;
}
