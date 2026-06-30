import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import Admin from "./Admin";
import "./styles.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8010`;

const API = `${API_BASE.replace(/\/$/, "")}/api`;

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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const softReveal = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

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
    <motion.article
      className="product-card"
      variants={fadeUp}
      layout
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <motion.div
        className="product-image-wrap"
        onClick={() => onOpen(product)}
        whileTap={{ scale: 0.985 }}
      >
        <img
          src={imageUrl(product.image)}
          alt={product.name}
          className="product-image"
        />
        <span className="product-tag">{product.tag}</span>
        <motion.button
          className={`heart ${liked ? "liked" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            setLiked(!liked);
          }}
          aria-label="Favoritar"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          animate={liked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        >
          <Icon name="heart" size={18} />
        </motion.button>
        <motion.button
          className="quick-add"
          disabled={soldOut}
          onClick={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
          whileTap={{ scale: 0.98 }}
        >
          {soldOut ? "Esgotado" : "Adicionar à sacola"}
        </motion.button>
      </motion.div>
      <motion.button
        className="product-copy"
        onClick={() => onOpen(product)}
        whileTap={{ scale: 0.99 }}
      >
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
      </motion.button>
    </motion.article>
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
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="overlay visible"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.aside
              className="cart-drawer open"
              aria-hidden={!open}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
            >
              <div className="drawer-head">
                <div>
                  <span className="eyebrow">Sua seleção</span>
                  <h2>Sacola</h2>
                </div>
                <motion.button
                  className="icon-button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon name="close" />
                </motion.button>
              </div>
              <div className="cart-body">
                {!items.length && (
                  <motion.div
                    className="empty-cart"
                    variants={softReveal}
                    initial="hidden"
                    animate="visible"
                  >
                    <span>✦</span>
                    <h3>Sua sacola está vazia</h3>
                    <p>
                      Escolha uma peça feita com calma para levar um pouco dessa
                      história para casa.
                    </p>
                    <button className="text-link" onClick={() => setOpen(false)}>
                      Conhecer as peças <Icon name="arrow" size={16} />
                    </button>
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      className="cart-item"
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 35 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 35 }}
                      transition={{ duration: 0.25 }}
                    >
                      <img src={imageUrl(item.image)} alt="" />
                      <div>
                        <span className="eyebrow">{item.material}</span>
                        <h3>{item.name}</h3>
                        <strong>{money(item.price)}</strong>
                        <div className="quantity">
                          <motion.button
                            onClick={() => change(item.id, -1)}
                            whileTap={{ scale: 0.86 }}
                          >
                            <Icon name="minus" size={14} />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            onClick={() => change(item.id, 1)}
                            whileTap={{ scale: 0.86 }}
                          >
                            <Icon name="plus" size={14} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {!!items.length && (
                <motion.div
                  className="cart-footer"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <div className="subtotal">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  <p>
                    Frete calculado no próximo passo. Envio gratuito acima de R$
                    450.
                  </p>
                  <motion.button
                    className="primary full"
                    onClick={onCheckout}
                    whileTap={{ scale: 0.98 }}
                  >
                    Ir para o checkout <Icon name="arrow" />
                  </motion.button>
                </motion.div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
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
    <motion.div
      className="checkout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="checkout-top"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <a className="brand small" href="#">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <motion.button
          className="icon-button"
          onClick={onClose}
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="close" />
        </motion.button>
      </motion.div>
      <motion.div
        className="checkout-progress"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <motion.span
          className={step >= 1 ? "active" : ""}
          animate={step === 1 ? { scale: 1.04 } : { scale: 1 }}
        >
          1. Entrega
        </motion.span>
        <i />
        <motion.span
          className={step >= 2 ? "active" : ""}
          animate={step === 2 ? { scale: 1.04 } : { scale: 1 }}
        >
          2. Pagamento
        </motion.span>
      </motion.div>
      <motion.main
        className="checkout-grid"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.form
          className="checkout-form"
          onSubmit={submit}
          variants={fadeUp}
        >
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
              <motion.button
                className="primary full"
                type="button"
                disabled={!deliveryComplete}
                onClick={() => setStep(2)}
                whileTap={{ scale: 0.98 }}
              >
                Continuar para pagamento <Icon name="arrow" />
              </motion.button>
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
              <motion.button
                className="primary full"
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? "Preparando pedido..."
                  : `Ir para o pagamento · ${money(subtotal + shippingPrice)}`}
              </motion.button>
              <motion.button
                className="back-link"
                type="button"
                onClick={() => setStep(1)}
                whileTap={{ scale: 0.96 }}
              >
                ← Voltar para entrega
              </motion.button>
            </>
          )}
        </motion.form>
        <motion.aside className="order-summary" variants={fadeUp}>
          <h2>Resumo do pedido</h2>
          {items.map((item) => (
            <motion.div className="summary-item" key={item.id} layout>
              <div>
                <img src={imageUrl(item.image)} />
                <span>{item.quantity}</span>
              </div>
              <p>
                {item.name}
                <small>{item.material}</small>
              </p>
              <strong>{money(item.price * item.quantity)}</strong>
            </motion.div>
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
        </motion.aside>
      </motion.main>
    </motion.div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {siteContent.announcement?.enabled && (
        <motion.div
          className="announcement"
          initial={{ y: -34 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {siteContent.announcement.text} <span>✦</span>{" "}
          {siteContent.announcement.secondary_text}
        </motion.div>
      )}
      <motion.header
        className="site-header"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <motion.button
          className="mobile-menu"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label={mobileMenu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenu}
          whileTap={{ scale: 0.9 }}
          animate={mobileMenu ? { rotate: 90 } : { rotate: 0 }}
        >
          <Icon name={mobileMenu ? "close" : "menu"} />
        </motion.button>
        <a className="brand" href="#">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <nav className="desktop-nav">
          <a href="#pecas">Peças</a>
          <a href="#colecoes">Coleções</a>
          <a href="#historia">Nossa história</a>
          <a href="#oficina">A oficina</a>
        </nav>
        <AnimatePresence>
          {mobileMenu && (
            <motion.nav
              className="mobile-nav"
              initial={{ opacity: 0, y: -18, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -14, scaleY: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                ["#pecas", "Peças"],
                ["#colecoes", "Coleções"],
                ["#historia", "Nossa história"],
                ["#oficina", "A oficina"],
              ].map(([href, label], index) => (
                <motion.a
                  href={href}
                  key={href}
                  onClick={() => setMobileMenu(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: index * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </motion.a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
        <div className="header-actions">
          <label className="search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar peças"
            />
          </label>
          <motion.button
            className="bag-button"
            onClick={() => setCartOpen(true)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
          >
            <Icon name="bag" />
            <motion.span
              key={cart.reduce((sum, item) => sum + item.quantity, 0)}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
            >
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </motion.span>
          </motion.button>
        </div>
      </motion.header>

      <main>
        <motion.section
          className="hero"
          variants={softReveal}
          initial="hidden"
          animate="visible"
        >
          <motion.img
            src={imageUrl(siteContent.hero?.image)}
            alt="Oficina de artesanato em madeira"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="hero-shade" />
          <motion.div
            className="hero-content"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.span className="eyebrow light" variants={fadeUp}>
              {siteContent.hero?.eyebrow}
            </motion.span>
            <motion.h1 variants={fadeUp}>
              {siteContent.hero?.title}
              <br />
              <em>{siteContent.hero?.title_emphasis}</em>
            </motion.h1>
            <motion.p variants={fadeUp}>{siteContent.hero?.subtitle}</motion.p>
            <motion.a
              className="primary cream"
              href={siteContent.hero?.button_url}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              {siteContent.hero?.button_text} <Icon name="arrow" />
            </motion.a>
          </motion.div>
          <motion.div
            className="hero-note"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
          >
            <span>01</span>
            <p>
              Pequenas séries
              <br />e peças únicas
            </p>
          </motion.div>
        </motion.section>

        <motion.section
          className="values"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <motion.div variants={fadeUp}>
            <Icon name="truck" />
            <p>
              <strong>Enviamos com cuidado</strong>
              <span>Embalagem protegida e rastreada</span>
            </p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Icon name="card" />
            <p>
              <strong>Pagamento tranquilo</strong>
              <span>PIX, boleto ou até 5x sem juros</span>
            </p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Icon name="shield" />
            <p>
              <strong>Feito para durar</strong>
              <span>Madeira tratada e origem responsável</span>
            </p>
          </motion.div>
        </motion.section>

        <motion.section
          className="catalog section"
          id="pecas"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <div>
              <span className="eyebrow">{siteContent.catalog?.eyebrow}</span>
              <h2>
                {siteContent.catalog?.title}{" "}
                <em>{siteContent.catalog?.title_emphasis}</em>
              </h2>
            </div>
            <p>{siteContent.catalog?.subtitle}</p>
          </motion.div>
          <motion.div className="filter-row" variants={fadeUp}>
            <div className="categories">
              {categories.map((item) => (
                <motion.button
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                  key={item}
                  whileTap={{ scale: 0.94 }}
                >
                  {item}
                </motion.button>
              ))}
            </div>
            <span>{filtered.length} peças</span>
          </motion.div>
          {filtered.length ? (
            <motion.div
              className="product-grid"
              variants={stagger}
              initial="hidden"
              animate="visible"
              layout
            >
              {filtered.map((product) => (
                <ProductCard
                  product={product}
                  onAdd={add}
                  onOpen={setSelected}
                  key={product.id}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="catalog-empty"
              role="status"
              variants={softReveal}
              initial="hidden"
              animate="visible"
            >
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
            </motion.div>
          )}
        </motion.section>

        <motion.section
          className="collections section"
          id="colecoes"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.28 }}
        >
          <motion.div
            className="collection-main"
            variants={softReveal}
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
          </motion.div>
          <motion.div className="collection-quote" variants={fadeUp}>
            <motion.span
              initial={{ rotate: -8, scale: 0.8 }}
              whileInView={{ rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              “
            </motion.span>
            <blockquote>{siteContent.featured_collection?.quote}</blockquote>
            <p>— {siteContent.featured_collection?.quote_author}</p>
          </motion.div>
        </motion.section>

        <motion.section
          className="story section"
          id="historia"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="story-image" variants={softReveal}>
            <motion.img
              src={imageUrl(siteContent.institutional?.image)}
              alt="Detalhe do trabalho artesanal"
              whileHover={{ scale: 1.025 }}
              transition={{ duration: 0.45 }}
            />
            <motion.div
              className="stamp"
              initial={{ rotate: -14, scale: 0.75, opacity: 0 }}
              whileInView={{ rotate: 8, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              feito
              <br />à mão
              <br />
              <span>✦</span>
            </motion.div>
          </motion.div>
          <motion.div className="story-copy" variants={fadeUp}>
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
          </motion.div>
        </motion.section>

        <motion.section
          className="newsletter"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <span className="eyebrow">Cartas da oficina</span>
          <h2>Novidades feitas sem pressa.</h2>
          <p>Receba histórias, lançamentos e os bastidores de cada coleção.</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Seu melhor e-mail" required />
            <motion.button whileTap={{ scale: 0.96 }}>
              Quero receber <Icon name="arrow" />
            </motion.button>
          </form>
        </motion.section>
      </main>
      <motion.footer
        id="oficina"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
      >
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
          <a href="/politica-de-privacidade">Privacidade</a> ·{" "}
          <a href="/termos-de-compra">Termos</a> ·{" "}
          <a href="/trocas-e-devolucoes">Trocas e devoluções</a> ·{" "}
          <a href="/admin">Administrar</a>
        </small>
      </motion.footer>
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
      <AnimatePresence>
        {selected && (
          <motion.div className="modal-shell">
            <motion.div
              className="overlay visible"
              onClick={() => setSelected(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="product-modal"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <motion.button
              className="icon-button modal-close"
              onClick={() => setSelected(null)}
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon name="close" />
            </motion.button>
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
              <motion.button
                className="primary full"
                onClick={() => add(selected)}
                whileTap={{ scale: 0.98 }}
              >
                Adicionar à sacola <Icon name="bag" />
              </motion.button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {orderId && (
          <motion.div className="success-modal">
            <motion.div
              className="overlay visible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <motion.span
                className="success-mark"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 14 }}
              >
                ✓
              </motion.span>
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
            <motion.button
              className="primary"
              onClick={() => setOrderId(null)}
              whileTap={{ scale: 0.98 }}
            >
              Voltar para a loja
            </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const legalPages = {
  "/politica-de-privacidade": {
    title: "Política de Privacidade",
    eyebrow: "LGPD e dados pessoais",
    sections: [
      [
        "Quais dados coletamos",
        "Coletamos apenas os dados necessários para operar a loja: nome, e-mail, telefone, endereço de entrega ou retirada, itens do pedido e informações de pagamento retornadas pelo provedor.",
      ],
      [
        "Como usamos os dados",
        "Usamos essas informações para processar pedidos, calcular entrega, prestar atendimento, enviar confirmações e cumprir obrigações legais.",
      ],
      [
        "Pagamentos",
        "Os dados sensíveis de cartão são tratados diretamente pelo provedor de pagamento. A loja não armazena número de cartão, código de segurança ou senha bancária.",
      ],
      [
        "Direitos do cliente",
        "O cliente pode solicitar acesso, correção ou exclusão dos seus dados pelos canais de atendimento da loja, respeitando prazos legais e obrigações fiscais.",
      ],
    ],
  },
  "/termos-de-compra": {
    title: "Termos de Compra",
    eyebrow: "Condições comerciais",
    sections: [
      [
        "Produtos artesanais",
        "As peças são feitas ou finalizadas manualmente. Pequenas variações de cor, textura, veio da madeira e acabamento fazem parte da natureza artesanal do produto.",
      ],
      [
        "Pagamento",
        "O pedido é confirmado após aprovação do pagamento pelo provedor escolhido. Pedidos pendentes podem ser cancelados caso o pagamento não seja concluído.",
      ],
      [
        "Estoque",
        "Peças únicas dependem de disponibilidade. Em caso de divergência de estoque, a loja entrará em contato para troca, encomenda ou reembolso.",
      ],
      [
        "Retirada local",
        "Quando disponível, a retirada é combinada após a confirmação do pedido e deve respeitar os horários de atendimento informados pela loja.",
      ],
    ],
  },
  "/trocas-e-devolucoes": {
    title: "Trocas e Devoluções",
    eyebrow: "Pós-venda",
    sections: [
      [
        "Arrependimento",
        "Compras online podem seguir o prazo legal de arrependimento previsto para comércio eletrônico. O produto deve retornar sem sinais de uso indevido.",
      ],
      [
        "Avaria no transporte",
        "Se a peça chegar danificada, entre em contato com fotos da embalagem e do produto para avaliação e solução.",
      ],
      [
        "Peças sob encomenda",
        "Produtos personalizados ou sob encomenda podem ter regras específicas, informadas antes da confirmação da compra.",
      ],
      [
        "Contato",
        "Para solicitar troca, devolução ou suporte, use o WhatsApp ou e-mail informado na loja, mencionando o código do pedido.",
      ],
    ],
  },
  "/politica-de-entrega": {
    title: "Política de Entrega",
    eyebrow: "Envio e retirada",
    sections: [
      [
        "Prazos",
        "Os prazos de entrega começam a contar após a confirmação do pagamento e podem variar conforme região, transportadora e tipo de peça.",
      ],
      [
        "Embalagem",
        "As peças são embaladas com proteção adequada para madeira artesanal, reduzindo risco de impacto durante o transporte.",
      ],
      [
        "Retirada",
        "Clientes próximos podem escolher retirada local quando essa opção estiver disponível no checkout.",
      ],
    ],
  },
};

function LegalPage({ page }) {
  useEffect(() => {
    document.title = `${page.title} | Casa Mamulengo`;
  }, [page.title]);
  return (
    <div className="legal-page">
      <header className="checkout-top">
        <a className="brand small" href="/">
          <span>Casa</span>
          <strong>Mamulengo</strong>
        </a>
        <a className="text-link" href="/">
          Voltar para a loja <Icon name="arrow" />
        </a>
      </header>
      <main className="legal-content">
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>
          Este texto é uma base operacional para a loja. Antes de uma operação
          comercial maior, revise com contador ou assessoria jurídica.
        </p>
        {page.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </main>
    </div>
  );
}

function Root() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return <Admin />;
  if (legalPages[path]) return <LegalPage page={legalPages[path]} />;
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <Root />,
);
