import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Admin from "./Admin";
import "./styles.css";

const API = `${window.location.protocol}//${window.location.hostname}:8010/api`;

const defaultSiteContent = {
  announcement: {
    enabled: true,
    text: "Frete grátis para todo o Brasil em compras acima de R$ 450",
    secondary_text: "Peças feitas à mão, uma a uma",
  },
  hero: {
    eyebrow: "Feito no Nordeste · desde 1987",
    title: "Madeira com",
    title_emphasis: "alma e história.",
    subtitle:
      "Peças esculpidas à mão, onde cada veio, marca e imperfeição conta um pouco de quem somos.",
    button_text: "Descobrir as peças",
    button_url: "#pecas",
    image: "/images/hero.png",
  },
  catalog: {
    eyebrow: "Escolhas da casa",
    title: "Peças que guardam",
    title_emphasis: "memória",
    subtitle:
      "Do sagrado ao cotidiano, objetos que atravessam gerações e deixam a casa um pouco mais nossa.",
  },
  featured_collection: {
    eyebrow: "Coleção em destaque",
    title: "Obras de Fé",
    subtitle:
      "Figuras silenciosas, santos populares e símbolos talhados com a delicadeza do tempo.",
    button_text: "Conhecer a coleção",
    image: "/images/santo.png",
    quote:
      "A mão encontra na madeira aquilo que já estava esperando para nascer.",
    quote_author: "Mestre Severino, fundador da oficina",
  },
  institutional: {
    eyebrow: "Nossa história",
    title: "O tempo também é",
    title_emphasis: "matéria-prima.",
    paragraph_1:
      "Na Casa Mamulengo, cada peça começa na escolha atenta da madeira e segue o ritmo das mãos.",
    paragraph_2:
      "Trabalhamos com madeira de origem responsável e reaproveitada, mantendo vivos os saberes que passam de mestre para aprendiz.",
    image: "/images/travessa.png",
  },
  contact: {
    address: "Rua dos Mestres, 87 · Olinda · Pernambuco",
    hours: "Segunda a sexta, 9h–17h",
    phone: "(81) 3333-1987",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    whatsapp_number: "558133331987",
    whatsapp_message:
      "Olá! Vim pelo site da Casa Mamulengo e gostaria de mais informações.",
    pickup_enabled: true,
    pickup_address: "Rua dos Mestres, 87 · Olinda · Pernambuco",
    pickup_city: "Olinda",
    pickup_state: "PE",
    pickup_cep: "00000000",
    pickup_instructions:
      "Após a confirmação do pagamento, combinaremos pelo WhatsApp o melhor horário para retirada.",
  },
  seo: {
    title: "Casa Mamulengo | Artesanato em Madeira",
    description: "Peças de madeira feitas à mão, com tempo, memória e afeto.",
  },
};

const fallbackProducts = [
  {
    id: 1,
    name: "São Francisco do Sertão",
    category: "Esculturas",
    collection: "Obras de Fé",
    price: 289,
    installments: 3,
    material: "Cedro",
    dimensions: "38 × 12 cm",
    image: "/images/santo.png",
    tag: "Peça única",
    featured: true,
  },
  {
    id: 2,
    name: "Travessa Folhagem",
    category: "Casa & Mesa",
    collection: "Raízes da Casa",
    price: 198,
    installments: 3,
    material: "Imburana",
    dimensions: "42 × 24 cm",
    image: "/images/travessa.png",
    tag: "Mais querida",
    featured: true,
  },
  {
    id: 3,
    name: "Pássaro Cantador",
    category: "Esculturas",
    collection: "Bichos do Brasil",
    price: 149,
    installments: 2,
    material: "Cajá",
    dimensions: "22 × 18 cm",
    image: "/images/passaro.png",
    tag: "Novo",
    featured: true,
  },
  {
    id: 4,
    name: "Caixa de Memórias",
    category: "Utilitários",
    collection: "Raízes da Casa",
    price: 169,
    installments: 2,
    material: "Freijó",
    dimensions: "20 × 14 cm",
    image: "/images/caixa.png",
    tag: "Edição limitada",
  },
  {
    id: 5,
    name: "Mamulengo Benedito",
    category: "Brinquedos",
    collection: "Mestres do Riso",
    price: 235,
    installments: 3,
    material: "Mulungu",
    dimensions: "46 × 13 cm",
    image: "/images/mamulengo.png",
    tag: "Autoral",
  },
  {
    id: 6,
    name: "Banco Sertanejo",
    category: "Mobiliário",
    collection: "Ofício Antigo",
    price: 490,
    installments: 5,
    material: "Madeira de demolição",
    dimensions: "48 × 32 × 28 cm",
    image: "/images/banco.png",
    tag: "Sob encomenda",
  },
];

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l1 13H5L6 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7A8.5 8.5 0 1 1 20.5 11.6Z" />
        <path d="M8.2 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.1.4 0 .6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .5-.2 1.5-1 2.1-.7.6-1.6.8-2.6.5-1.1-.3-2.7-.9-4.5-2.5-1.5-1.4-2.5-3.1-2.8-4.3-.3-1.1 0-1.9.4-2.5Z" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

const money = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const imageUrl = (url) =>
  url?.startsWith("/uploads/")
    ? `${window.location.protocol}//${window.location.hostname}:8010${url}`
    : url;

function WhatsAppButton({ contact }) {
  if (!contact?.whatsapp_number) return null;
  const number = String(contact.whatsapp_number).replace(/\D/g, "");
  const message =
    contact.whatsapp_message ||
    "Olá! Vim pelo site e gostaria de mais informações.";
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Casa Mamulengo pelo WhatsApp"
      title="Fale conosco pelo WhatsApp"
    >
      <Icon name="whatsapp" size={30} />
      <span>Fale conosco</span>
    </a>
  );
}

function ProductCard({ product, onAdd, onOpen }) {
  const [liked, setLiked] = useState(false);
  const soldOut = product.track_stock && product.stock <= 0;
  return (
    <article className="product-card">
      <div className="product-image-wrap" onClick={() => onOpen(product)}>
        <img
          src={imageUrl(product.image)}
          alt={product.name}
          className="product-image"
        />
        <span className="product-tag">{product.tag}</span>
        <button
          className={`heart ${liked ? "liked" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            setLiked(!liked);
          }}
          aria-label="Favoritar"
        >
          <Icon name="heart" size={18} />
        </button>
        <button
          className="quick-add"
          disabled={soldOut}
          onClick={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
        >
          {soldOut ? "Esgotado" : "Adicionar à sacola"}
        </button>
      </div>
      <button className="product-copy" onClick={() => onOpen(product)}>
        <span className="eyebrow">{product.collection}</span>
        <h3>{product.name}</h3>
        <p>
          {product.material} · {product.dimensions}
        </p>
        <strong>{money(product.price)}</strong>
        <small>
          ou {product.installments}x de{" "}
          {money(product.price / product.installments)} sem juros
        </small>
      </button>
    </article>
  );
}

function Cart({ open, setOpen, items, setItems, onCheckout }) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const change = (id, delta) =>
    setItems(
      items
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(
                    item.quantity + delta,
                    item.track_stock ? item.stock : Number.MAX_SAFE_INTEGER,
                  ),
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  return (
    <>
      <div
        className={`overlay ${open ? "visible" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`cart-drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Sua seleção</span>
            <h2>Sacola</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="cart-body">
          {!items.length && (
            <div className="empty-cart">
              <span>✦</span>
              <h3>Sua sacola está vazia</h3>
              <p>
                Escolha uma peça feita com calma para levar um pouco dessa
                história para casa.
              </p>
              <button className="text-link" onClick={() => setOpen(false)}>
                Conhecer as peças <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={imageUrl(item.image)} alt="" />
              <div>
                <span className="eyebrow">{item.material}</span>
                <h3>{item.name}</h3>
                <strong>{money(item.price)}</strong>
                <div className="quantity">
                  <button onClick={() => change(item.id, -1)}>
                    <Icon name="minus" size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => change(item.id, 1)}>
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!!items.length && (
          <div className="cart-footer">
            <div className="subtotal">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>
              Frete calculado no próximo passo. Envio gratuito acima de R$ 450.
            </p>
            <button className="primary full" onClick={onCheckout}>
              Ir para o checkout <Icon name="arrow" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function Checkout({ items, siteContent, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [shipping, setShipping] = useState(null);
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [selectedShipping, setSelectedShipping] = useState("economico");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutConfig, setCheckoutConfig] = useState(null);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingPrice =
    shipping?.options.find((option) => option.id === selectedShipping)?.price ||
    0;
  const updateCustomer = (field) => (event) =>
    setCustomer((current) => ({ ...current, [field]: event.target.value }));
  const deliveryComplete =
    customer.name.trim().length >= 3 &&
    customer.email.trim() &&
    customer.phone.trim().length >= 8 &&
    (deliveryMode === "pickup" ||
      (customer.address.trim().length >= 5 &&
        customer.city.trim().length >= 2 &&
        customer.state.trim().length === 2 &&
        cep.replace(/\D/g, "").length === 8));

  useEffect(() => {
    fetch(`${API}/checkout/config`)
      .then((response) => response.json())
      .then(setCheckoutConfig)
      .catch(() => {});
  }, []);

  const calculate = async () => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, subtotal }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail);
      setShipping(result);
    } catch {
      setError("Não foi possível calcular o frete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      customer: {
        ...customer,
        cep: deliveryMode === "pickup" ? "" : cep,
        address: deliveryMode === "pickup" ? "" : customer.address,
        city: deliveryMode === "pickup" ? "" : customer.city,
        state: deliveryMode === "pickup" ? "" : customer.state,
      },
      payment_method: "mercado_pago",
      shipping_service: deliveryMode === "pickup" ? "retirada" : selectedShipping,
    };
    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const order = await response.json();
      if (!response.ok)
        throw new Error(order.detail || "Não foi possível criar o pedido");
      if (order.payment_url) {
        window.location.assign(order.payment_url);
        return;
      }
      onSuccess(order);
    } catch (submitError) {
      setError(submitError.message || "Não foi possível concluir o pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout">
      <div className="checkout-top">
        <a className="brand small" href="#">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <button className="icon-button" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="checkout-progress">
        <span className={step >= 1 ? "active" : ""}>1. Entrega</span>
        <i />
        <span className={step >= 2 ? "active" : ""}>2. Pagamento</span>
      </div>
      <main className="checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <span className="eyebrow">Finalizar encomenda</span>
          <h1>{step === 1 ? "Para onde enviamos?" : "Como prefere pagar?"}</h1>
          {step === 1 ? (
            <>
              <div className="fulfillment-options">
                <button
                  type="button"
                  className={deliveryMode === "delivery" ? "selected" : ""}
                  onClick={() => {
                    setDeliveryMode("delivery");
                    setSelectedShipping("economico");
                  }}
                >
                  <Icon name="truck" />
                  <span><strong>Receber em casa</strong><small>Calcule o frete pelo CEP</small></span>
                </button>
                {siteContent.contact?.pickup_enabled !== false && (
                  <button
                    type="button"
                    className={deliveryMode === "pickup" ? "selected" : ""}
                    onClick={() => {
                      setDeliveryMode("pickup");
                      setSelectedShipping("retirada");
                    }}
                  >
                    <Icon name="bag" />
                    <span><strong>Retirar na loja</strong><small>Sem custo de entrega</small></span>
                  </button>
                )}
              </div>
              <div className="field-row">
                <label>
                  Nome completo
                  <input
                    required
                    value={customer.name}
                    onChange={updateCustomer("name")}
                    placeholder="Seu nome"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    required
                    type="email"
                    value={customer.email}
                    onChange={updateCustomer("email")}
                    placeholder="voce@email.com"
                  />
                </label>
              </div>
              <div className="field-row">
                <label>
                  Telefone
                  <input
                    required
                    value={customer.phone}
                    onChange={updateCustomer("phone")}
                    placeholder="(85) 99999-9999"
                  />
                </label>
                {deliveryMode === "delivery" && <label>
                  CEP
                  <div className="inline-field">
                    <input
                      required
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                    />
                    <button type="button" onClick={calculate}>
                      {loading ? "..." : "Calcular"}
                    </button>
                  </div>
                </label>}
              </div>
              {deliveryMode === "delivery" ? <>
              <label>
                Endereço
                <input
                  required
                  value={customer.address}
                  onChange={updateCustomer("address")}
                  placeholder="Rua, número e complemento"
                />
              </label>
              <div className="field-row city">
                <label>
                  Cidade
                  <input
                    required
                    value={customer.city}
                    onChange={updateCustomer("city")}
                    placeholder="Sua cidade"
                  />
                </label>
                <label>
                  UF
                  <input
                    required
                    value={customer.state}
                    onChange={updateCustomer("state")}
                    maxLength="2"
                    placeholder="CE"
                  />
                </label>
              </div>
              </> : <div className="pickup-notice">
                <Icon name="bag" />
                <div>
                  <strong>Retirada em {siteContent.contact?.pickup_address || siteContent.contact?.address}</strong>
                  <p>{siteContent.contact?.pickup_instructions}</p>
                </div>
              </div>}
              {deliveryMode === "delivery" && shipping && (
                <div className="shipping-options">
                  {shipping.options.map((option) => (
                    <label
                      className={
                        selectedShipping === option.id ? "selected" : ""
                      }
                      key={option.id}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={option.id}
                        checked={selectedShipping === option.id}
                        onChange={() => setSelectedShipping(option.id)}
                      />
                      <Icon name="truck" />
                      <span>
                        <strong>{option.name}</strong>
                        <small>{option.days}</small>
                      </span>
                      <b>{option.price ? money(option.price) : "Grátis"}</b>
                    </label>
                  ))}
                </div>
              )}
              {!deliveryComplete && (
                <p className="form-hint">
                  Preencha os dados de entrega para continuar.
                </p>
              )}
              <button
                className="primary full"
                type="button"
                disabled={!deliveryComplete}
                onClick={() => setStep(2)}
              >
                Continuar para pagamento <Icon name="arrow" />
              </button>
            </>
          ) : (
            <>
              <div className="payment-provider">
                <Icon name="card" />
                <div>
                  <strong>Mercado Pago</strong>
                  <p>PIX, cartão ou boleto em um ambiente seguro.</p>
                  <small>{checkoutConfig?.message}</small>
                </div>
              </div>
              <div className="payment-note">
                <Icon name="shield" />
                <div>
                  <strong>Pagamento protegido</strong>
                  <p>
                    Os dados bancários são informados diretamente ao provedor.
                    A Casa Mamulengo não armazena números de cartão.
                  </p>
                </div>
              </div>
              {error && <div className="checkout-error">{error}</div>}
              <button className="primary full" type="submit" disabled={loading}>
                {loading
                  ? "Preparando pedido..."
                  : `Ir para o pagamento · ${money(subtotal + shippingPrice)}`}
              </button>
              <button
                className="back-link"
                type="button"
                onClick={() => setStep(1)}
              >
                ← Voltar para entrega
              </button>
            </>
          )}
        </form>
        <aside className="order-summary">
          <h2>Resumo do pedido</h2>
          {items.map((item) => (
            <div className="summary-item" key={item.id}>
              <div>
                <img src={imageUrl(item.image)} />
                <span>{item.quantity}</span>
              </div>
              <p>
                {item.name}
                <small>{item.material}</small>
              </p>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-lines">
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <p>
              <span>Envio</span>
              <b>
                {deliveryMode === "pickup"
                  ? "Retirada grátis"
                  : shipping
                  ? shippingPrice
                    ? money(shippingPrice)
                    : "Grátis"
                  : "A calcular"}
              </b>
            </p>
            <p className="total">
              <span>Total</span>
              <b>{money(subtotal + shippingPrice)}</b>
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [siteContent, setSiteContent] = useState(defaultSiteContent);
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("casa-cart") || "[]"),
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [selected, setSelected] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => {});
    fetch(`${API}/categories`)
      .then((res) => res.json())
      .then(setCatalogCategories)
      .catch(() => {});
    const preview = new URLSearchParams(window.location.search).has("preview");
    fetch(`${API}${preview ? "/admin/content/preview" : "/site-content"}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Conteúdo indisponível");
        return res.json();
      })
      .then(setSiteContent)
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const orderCode = params.get("pedido");
    const trackingToken = params.get("token");
    if (orderCode && trackingToken) {
      fetch(
        `${API}/orders/${encodeURIComponent(orderCode)}?token=${encodeURIComponent(trackingToken)}`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Pedido não encontrado");
          return response.json();
        })
        .then((order) => setOrderId({ ...order, order_id: order.code }))
        .catch(() => {});
    }
  }, []);
  useEffect(() => {
    document.title = siteContent.seo?.title || defaultSiteContent.seo.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      siteContent.seo?.description || defaultSiteContent.seo.description;
  }, [siteContent]);
  useEffect(() => {
    localStorage.setItem("casa-cart", JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "Todas" || product.category === category) &&
          product.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, category, query],
  );
  const categories = [
    "Todas",
    ...new Set([
      ...catalogCategories.map((item) => item.name),
      ...products.map((product) => product.category),
    ]),
  ];
  const add = (product) => {
    if (product.track_stock && product.stock <= 0) return;
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: product.track_stock
                    ? Math.min(item.quantity + 1, product.stock)
                    : item.quantity + 1,
                }
              : item,
          )
        : [...current, { ...product, quantity: 1 }],
    );
    setSelected(null);
    setCartOpen(true);
  };

  if (checkout)
    return (
      <>
        <Checkout
          items={cart}
          siteContent={siteContent}
          onClose={() => setCheckout(false)}
          onSuccess={(order) => {
            setOrderId(order);
            setCheckout(false);
            setCart([]);
          }}
        />
        <WhatsAppButton contact={siteContent.contact} />
      </>
    );

  return (
    <div>
      {siteContent.announcement?.enabled && (
        <div className="announcement">
          {siteContent.announcement.text} <span>✦</span>{" "}
          {siteContent.announcement.secondary_text}
        </div>
      )}
      <header className="site-header">
        <button
          className="mobile-menu"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <Icon name="menu" />
        </button>
        <a className="brand" href="#">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <nav className={mobileMenu ? "mobile-open" : ""}>
          <a href="#pecas">Peças</a>
          <a href="#colecoes">Coleções</a>
          <a href="#historia">Nossa história</a>
          <a href="#oficina">A oficina</a>
        </nav>
        <div className="header-actions">
          <label className="search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar peças"
            />
          </label>
          <button className="bag-button" onClick={() => setCartOpen(true)}>
            <Icon name="bag" />
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <img
            src={imageUrl(siteContent.hero?.image)}
            alt="Oficina de artesanato em madeira"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow light">{siteContent.hero?.eyebrow}</span>
            <h1>
              {siteContent.hero?.title}
              <br />
              <em>{siteContent.hero?.title_emphasis}</em>
            </h1>
            <p>{siteContent.hero?.subtitle}</p>
            <a className="primary cream" href={siteContent.hero?.button_url}>
              {siteContent.hero?.button_text} <Icon name="arrow" />
            </a>
          </div>
          <div className="hero-note">
            <span>01</span>
            <p>
              Pequenas séries
              <br />e peças únicas
            </p>
          </div>
        </section>

        <section className="values">
          <div>
            <Icon name="truck" />
            <p>
              <strong>Enviamos com cuidado</strong>
              <span>Embalagem protegida e rastreada</span>
            </p>
          </div>
          <div>
            <Icon name="card" />
            <p>
              <strong>Pagamento tranquilo</strong>
              <span>PIX, boleto ou até 5x sem juros</span>
            </p>
          </div>
          <div>
            <Icon name="shield" />
            <p>
              <strong>Feito para durar</strong>
              <span>Madeira tratada e origem responsável</span>
            </p>
          </div>
        </section>

        <section className="catalog section" id="pecas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{siteContent.catalog?.eyebrow}</span>
              <h2>
                {siteContent.catalog?.title}{" "}
                <em>{siteContent.catalog?.title_emphasis}</em>
              </h2>
            </div>
            <p>{siteContent.catalog?.subtitle}</p>
          </div>
          <div className="filter-row">
            <div className="categories">
              {categories.map((item) => (
                <button
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
            <span>{filtered.length} peças</span>
          </div>
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  product={product}
                  onAdd={add}
                  onOpen={setSelected}
                  key={product.id}
                />
              ))}
            </div>
          ) : (
            <div className="catalog-empty" role="status">
              <span>✦</span>
              <h3>
                {query
                  ? "Nenhuma peça encontrada"
                  : `Ainda não há peças em ${category}`}
              </h3>
              <p>
                {query
                  ? "Tente buscar por outro nome ou explore todas as peças da oficina."
                  : "Novas peças estão sendo preparadas. Enquanto isso, conheça as outras criações da casa."}
              </p>
              <button
                className="primary"
                onClick={() => {
                  setCategory("Todas");
                  setQuery("");
                }}
              >
                Ver todas as peças <Icon name="arrow" />
              </button>
            </div>
          )}
        </section>

        <section className="collections section" id="colecoes">
          <div
            className="collection-main"
            style={{
              backgroundImage: `linear-gradient(rgba(42,24,14,.58),rgba(42,24,14,.58)), url("${imageUrl(siteContent.featured_collection?.image)}")`,
            }}
          >
            <div>
              <span className="eyebrow light">
                {siteContent.featured_collection?.eyebrow}
              </span>
              <h2>{siteContent.featured_collection?.title}</h2>
              <p>{siteContent.featured_collection?.subtitle}</p>
              <button
                onClick={() => {
                  setCategory("Esculturas");
                  document
                    .querySelector("#pecas")
                    .scrollIntoView({ behavior: "smooth" });
                }}
                className="text-link light"
              >
                {siteContent.featured_collection?.button_text}{" "}
                <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div className="collection-quote">
            <span>“</span>
            <blockquote>{siteContent.featured_collection?.quote}</blockquote>
            <p>— {siteContent.featured_collection?.quote_author}</p>
          </div>
        </section>

        <section className="story section" id="historia">
          <div className="story-image">
            <img
              src={imageUrl(siteContent.institutional?.image)}
              alt="Detalhe do trabalho artesanal"
            />
            <div className="stamp">
              feito
              <br />à mão
              <br />
              <span>✦</span>
            </div>
          </div>
          <div className="story-copy">
            <span className="eyebrow">
              {siteContent.institutional?.eyebrow}
            </span>
            <h2>
              {siteContent.institutional?.title}
              <br />
              <em>{siteContent.institutional?.title_emphasis}</em>
            </h2>
            <p>{siteContent.institutional?.paragraph_1}</p>
            <p>{siteContent.institutional?.paragraph_2}</p>
            <a className="text-link" href="#oficina">
              Entrar na oficina <Icon name="arrow" />
            </a>
          </div>
        </section>

        <section className="newsletter">
          <span className="eyebrow">Cartas da oficina</span>
          <h2>Novidades feitas sem pressa.</h2>
          <p>Receba histórias, lançamentos e os bastidores de cada coleção.</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Seu melhor e-mail" required />
            <button>
              Quero receber <Icon name="arrow" />
            </button>
          </form>
        </section>
      </main>
      <footer id="oficina">
        <a className="brand footer-brand" href="#">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <div>
          <h4>Visite a oficina</h4>
          <p>{siteContent.contact?.address}</p>
        </div>
        <div>
          <h4>Atendimento</h4>
          <p>
            {siteContent.contact?.hours}
            <br />
            {siteContent.contact?.phone}
          </p>
        </div>
        <div>
          <h4>Siga o fazer</h4>
          <p>
            {siteContent.contact?.instagram}
            <br />
            {siteContent.contact?.whatsapp}
          </p>
        </div>
        <small>
          © 2026 Casa Mamulengo · Feito com tempo no Brasil. ·{" "}
          <a href="/admin">Administrar</a>
        </small>
      </footer>
      <WhatsAppButton contact={siteContent.contact} />

      <Cart
        open={cartOpen}
        setOpen={setCartOpen}
        items={cart}
        setItems={setCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckout(true);
        }}
      />
      {selected && (
        <div className="modal-shell">
          <div className="overlay visible" onClick={() => setSelected(null)} />
          <div className="product-modal">
            <button
              className="icon-button modal-close"
              onClick={() => setSelected(null)}
            >
              <Icon name="close" />
            </button>
            <img src={imageUrl(selected.image)} alt={selected.name} />
            <div>
              <span className="eyebrow">{selected.collection}</span>
              <h2>{selected.name}</h2>
              <p className="modal-description">
                {selected.description ||
                  "Uma peça singular, talhada e finalizada à mão em nossa oficina."}
              </p>
              <dl>
                <div>
                  <dt>Madeira</dt>
                  <dd>{selected.material}</dd>
                </div>
                <div>
                  <dt>Medidas</dt>
                  <dd>{selected.dimensions}</dd>
                </div>
                <div>
                  <dt>Acabamento</dt>
                  <dd>Cera natural</dd>
                </div>
              </dl>
              <strong className="modal-price">{money(selected.price)}</strong>
              <small>em até {selected.installments}x sem juros</small>
              <button className="primary full" onClick={() => add(selected)}>
                Adicionar à sacola <Icon name="bag" />
              </button>
            </div>
          </div>
        </div>
      )}
      {orderId && (
        <div className="success-modal">
          <div className="overlay visible" />
          <div>
            <span className="success-mark">✓</span>
            <span className="eyebrow">Pedido recebido</span>
            <h2>Já estamos cuidando de tudo.</h2>
            <p>
              Seu pedido{" "}
              <strong>{orderId.order_id || orderId.code}</strong> foi registrado
              com status{" "}
              <strong>
                {(orderId.payment_status || orderId.status).replaceAll("_", " ")}
              </strong>
              .{" "}
              {orderId.total != null && (
                <>
                  Total: <strong>{money(orderId.total)}</strong>.
                </>
              )}
            </p>
            {!orderId.payment_url && orderId.payment_configured === false && (
              <p className="payment-warning">
                O Mercado Pago ainda precisa ser configurado pelo administrador.
                O pedido ficou reservado, sem cobrança.
              </p>
            )}
            <button className="primary" onClick={() => setOrderId(null)}>
              Voltar para a loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  window.location.pathname.startsWith("/admin") ? <Admin /> : <App />,
);
