import { useState, useEffect } from "react";

const API = "http://localhost:3000/api";
const IMG = "http://localhost:3000";
const STORAGE_KEY = "biblioteca_user";

/* ── helpers ── */
const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num === 0) return "FREE";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function deriveStatus(stock, currentStatus) {
  if (currentStatus === "inactive") return "inactive";
  if (Number(stock) === 0) return "out_of_stock";
  if (currentStatus === "out_of_stock") return "active";
  return currentStatus;
}

const statusColor = { active: "#b8ff57", inactive: "#ff6b6b", out_of_stock: "#ffaa00" };

/* ══════════════ VALIDATORS ══════════════ */
const V = {
  nome:     v => !v?.trim() ? "Nome é obrigatório" : v.trim().length < 2 ? "Mín. 2 caracteres" : v.trim().length > 255 ? "Máx. 255 caracteres" : null,
  email:    v => !v?.trim() ? "Email é obrigatório" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "Email inválido" : null,
  password: v => !v ? "Senha é obrigatória" : v.length < 4 ? "Mín. 4 caracteres" : v.length > 255 ? "Máx. 255 caracteres" : null,
  telefone: v => { if (!v?.trim()) return null; const d = v.replace(/\D/g,""); return d.length > 0 && d.length < 10 ? "Mín. 10 dígitos" : d.length > 15 ? "Muito longo" : null; },
  preco:    v => { if (v===""||v==null) return "Preço é obrigatório"; const n=Number(v); return isNaN(n)?"Deve ser um número":n<0?"Não pode ser negativo":null; },
  estoque:  v => { if (v===""||v==null) return "Estoque é obrigatório"; const n=Number(v); return isNaN(n)||!Number.isInteger(n)?"Deve ser inteiro":n<0?"Não pode ser negativo":null; },
  titulo:   v => !v?.trim() ? "Título é obrigatório" : v.trim().length > 255 ? "Máx. 255 caracteres" : null,
  autor:    v => !v?.trim() ? "Autor é obrigatório" : v.trim().length < 2 ? "Mín. 2 caracteres" : v.trim().length > 255 ? "Máx. 255 caracteres" : null,
  rua:      v => !v?.trim() ? "Rua é obrigatória" : null,
  cidade:   v => !v?.trim() ? "Cidade é obrigatória" : null,
  estado:   v => !v?.trim() ? "Estado é obrigatório" : null,
  cep:      v => !v?.trim() ? "CEP é obrigatório" : null,
};

function validate(pairs, form) {
  const e = {};
  pairs.forEach(([f, vk]) => { const err = V[vk]?.(form[f]); if (err) e[f] = err; });
  return e;
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  } catch (err) {
    if (err.message.includes("JSON")) throw new Error(`Erro do servidor (${res.status})`);
    throw err;
  }
}

/* ══════════════ ATOMS ══════════════ */
const Tag = ({ children, color }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", background:color+"18", border:`1px solid ${color}40`, color, borderRadius:2, fontFamily:"'Inconsolata',monospace", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{children}</span>
);

const Spinner = () => (
  <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
    <div style={{ width:28, height:28, border:"2px solid #1e1e1e", borderTop:"2px solid #b8ff57", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
  </div>
);

const Toast = ({ msg, type }) => !msg ? null : (
  <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:type==="error"?"#1a0505":"#071200", border:`1px solid ${type==="error"?"#ff4444":"#b8ff57"}`, color:type==="error"?"#ff6b6b":"#b8ff57", padding:"11px 20px", borderRadius:2, fontFamily:"'Inconsolata',monospace", fontSize:13, maxWidth:"calc(100vw - 48px)", animation:"fadeUp .2s ease" }}>{msg}</div>
);

function Cover({ src, size=120 }) {
  const [err, setErr] = useState(false);
  const h = Math.round(size * 1.4);
  if (!src || err) return <div style={{ width:size, height:h, background:"#111", border:"1px solid #1e1e1e", borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:Math.round(size*.32) }}>📖</div>;
  return <img src={IMG+src} alt="cover" onError={()=>setErr(true)} style={{ width:size, height:h, objectFit:"cover", borderRadius:2, flexShrink:0, display:"block" }} />;
}

const BackBtn = ({ onClick, label="← VOLTAR" }) => (
  <button onClick={onClick} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontFamily:"'Inconsolata',monospace", fontSize:12, letterSpacing:1, padding:0, marginBottom:24, display:"flex", alignItems:"center", gap:6 }} onMouseEnter={e=>e.currentTarget.style.color="#b8ff57"} onMouseLeave={e=>e.currentTarget.style.color="#555"}>{label}</button>
);

function Btn({ children, onClick, loading, full, variant="primary", small }) {
  const s = { primary:{bg:"#b8ff57",color:"#0a0a0a",sh:"3px 3px 0 #4a8a00"}, danger:{bg:"#ff4444",color:"#fff",sh:"3px 3px 0 #8a0000"}, ghost:{bg:"transparent",color:"#b8ff57",sh:"none",border:"1px solid #b8ff5740"} }[variant];
  return <button onClick={onClick} disabled={loading} style={{ width:full?"100%":"auto", padding:small?"7px 14px":"10px 22px", background:loading?"#111":s.bg, color:loading?"#333":s.color, border:s.border||"none", borderRadius:2, cursor:loading?"not-allowed":"pointer", fontFamily:"'Inconsolata',monospace", fontSize:small?11:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", boxShadow:!loading?s.sh:"none", transition:"all .15s", whiteSpace:"nowrap" }}>{loading?"...":children}</button>;
}

const SearchBar = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Buscar..."} style={{ padding:"8px 14px", background:"#0d0d0d", border:"1px solid #1e1e1e", color:"#f0ece4", fontFamily:"'Inconsolata',monospace", fontSize:13, borderRadius:2, outline:"none", width:"100%", maxWidth:340, boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#b8ff57"} onBlur={e=>e.target.style.borderColor="#1e1e1e"} />
);

const ConfirmModal = ({ msg, onConfirm, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:"#0d0d0d", border:"1px solid #2a2a2a", borderRadius:3, padding:"28px clamp(20px,4vw,32px)", maxWidth:360, width:"100%" }}>
      <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:14, color:"#f0ece4", marginBottom:24, lineHeight:1.6 }}>{msg}</p>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}><Btn onClick={onConfirm} variant="danger">Confirmar</Btn><Btn onClick={onCancel} variant="ghost">Cancelar</Btn></div>
    </div>
  </div>
);

function Field({ label, name, type="text", value, onChange, onBlur, error, placeholder, span, as, children, required, hint }) {
  const border = error ? "#ff4444" : "#1e1e1e";
  const base = { width:"100%", padding:"10px 14px", background:"#080808", border:`1px solid ${border}`, color:"#f0ece4", fontFamily:"'Inconsolata',monospace", fontSize:14, borderRadius:2, outline:"none", boxSizing:"border-box", transition:"border-color .15s" };
  return (
    <div style={{ gridColumn:span?`span ${span}`:undefined }}>
      <label style={{ display:"block", fontFamily:"'Inconsolata',monospace", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:4, color:error?"#ff6b6b":"#444" }}>
        {label}{required&&<span style={{ color:"#ff6b6b" }}> *</span>}
      </label>
      {error && <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#ff6b6b", marginBottom:5 }}>⚠ {error}</p>}
      {as==="textarea" ? <textarea name={name} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} style={{ ...base, resize:"vertical", minHeight:80 }} onFocus={e=>{if(!error)e.target.style.borderColor="#b8ff57"}} />
       : as==="select" ? <select name={name} value={value} onChange={onChange} style={{ ...base, cursor:"pointer" }}>{children}</select>
       : <input type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} style={base} onFocus={e=>{if(!error)e.target.style.borderColor="#b8ff57"}} />}
      {hint && !error && <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#555", marginTop:4 }}>{hint}</p>}
    </div>
  );
}

/* ══════════════ USER AVATAR CHIP ══════════════ */
function UserChip({ user, onLogout, isAdmin, viewMode, setViewMode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"1px solid #1e1e1e", borderRadius:20, padding:"4px 10px 4px 4px", cursor:"pointer", transition:"border-color .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="#b8ff57"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:"#1a1a1a", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#b8ff57", flexShrink:0 }}>{user.name?.charAt(0).toUpperCase()}</div>
        <span style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#ccc", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</span>
        {isAdmin && <Tag color="#ff9f43">admin</Tag>}
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#0d0d0d", border:"1px solid #2a2a2a", borderRadius:3, minWidth:180, zIndex:200, overflow:"hidden", animation:"fadeUp .15s ease" }} onMouseLeave={()=>setOpen(false)}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #1a1a1a" }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#f0ece4", marginBottom:2 }}>{user.name}</p>
            <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#555", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</p>
          </div>
          {isAdmin && (
            <button onClick={()=>{setViewMode(v=>v==="admin"?"client":"admin");setOpen(false);}} style={{ width:"100%", padding:"10px 16px", background:"none", border:"none", color:"#b8ff57", cursor:"pointer", fontFamily:"'Inconsolata',monospace", fontSize:11, textAlign:"left", letterSpacing:1 }}>
              {viewMode==="admin"?"👁 Ver como cliente":"⚙ Painel admin"}
            </button>
          )}
          <button onClick={()=>{setOpen(false);onLogout();}} style={{ width:"100%", padding:"10px 16px", background:"none", border:"none", color:"#ff6b6b", cursor:"pointer", fontFamily:"'Inconsolata',monospace", fontSize:11, textAlign:"left", letterSpacing:1, borderTop:"1px solid #1a1a1a" }}>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════ LOGIN ══════════════ */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nome:"", email:"", password:"", telefone:"", rua:"", numero:"", bairro:"", cidade:"", estado:"", cep:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState({ text:"", ok:false });

  const handle = e => { const{name,value}=e.target; setForm(f=>({...f,[name]:value})); if(errors[name]) setErrors(er=>({...er,[name]:null})); };
  const blur = (n,vk) => () => { const err=V[vk]?.(form[n]); setErrors(er=>({...er,[n]:err||null})); };

  const submit = async () => {
    setServerMsg({text:"",ok:false});
    const pairs = mode==="login" ? [["email","email"],["password","password"]] : [["nome","nome"],["email","email"],["password","password"],["telefone","telefone"],["rua","rua"],["cidade","cidade"],["estado","estado"],["cep","cep"]];
    const e = validate(pairs, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (mode==="login") {
        const data = await apiFetch(`${API}/users/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.email.trim(),password:form.password})});
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        await apiFetch(`${API}/users/clientes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.nome.trim(),email:form.email.trim(),password:form.password,telefone:form.telefone,endereco:{rua:form.rua.trim(),numero:form.numero,bairro:form.bairro,cidade:form.cidade.trim(),estado:form.estado.trim(),cep:form.cep.trim()}})});
        setMode("login"); setForm(f=>({...f,nome:"",password:""}));
        setServerMsg({text:"Cadastro realizado! Faça login.",ok:true});
      }
    } catch(err) { setServerMsg({text:err.message,ok:false}); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:480 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#b8ff57", letterSpacing:4, textTransform:"uppercase", marginBottom:8 }}>Biblioteca</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,6vw,42px)", color:"#f0ece4" }}>{mode==="login"?"Bem-vindo":"Criar conta"}</h1>
        </div>
        {serverMsg.text && <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:12, color:serverMsg.ok?"#b8ff57":"#ff6b6b", background:serverMsg.ok?"#071200":"#1a0505", border:`1px solid ${serverMsg.ok?"#b8ff5740":"#ff444440"}`, borderRadius:2, padding:"10px 14px", marginBottom:20, textAlign:"center" }}>{serverMsg.text}</div>}
        <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:3, padding:"clamp(18px,4vw,32px)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {mode==="register" && <Field label="Nome completo" name="nome" value={form.nome} onChange={handle} onBlur={blur("nome","nome")} error={errors.nome} placeholder="João Silva" span={2} required />}
          <Field label="Email" name="email" type="email" value={form.email} onChange={handle} onBlur={blur("email","email")} error={errors.email} placeholder="joao@email.com" span={2} required />
          <Field label="Senha" name="password" type="password" value={form.password} onChange={handle} onBlur={blur("password","password")} error={errors.password} placeholder="••••••" span={2} required />
          {mode==="register" && (<>
            <Field label="Telefone" name="telefone" value={form.telefone} onChange={handle} onBlur={blur("telefone","telefone")} error={errors.telefone} placeholder="(41) 99999-9999" span={2} />
            <div style={{ gridColumn:"span 2", borderTop:"1px solid #1a1a1a", paddingTop:14 }}>
              <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Endereço</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Rua" name="rua" value={form.rua} onChange={handle} onBlur={blur("rua","rua")} error={errors.rua} placeholder="Rua das Flores" span={2} required />
                <Field label="Número" name="numero" value={form.numero} onChange={handle} placeholder="123" />
                <Field label="Bairro" name="bairro" value={form.bairro} onChange={handle} placeholder="Centro" />
                <Field label="Cidade" name="cidade" value={form.cidade} onChange={handle} onBlur={blur("cidade","cidade")} error={errors.cidade} placeholder="Curitiba" required />
                <Field label="Estado" name="estado" value={form.estado} onChange={handle} onBlur={blur("estado","estado")} error={errors.estado} placeholder="PR" required />
                <Field label="CEP" name="cep" value={form.cep} onChange={handle} onBlur={blur("cep","cep")} error={errors.cep} placeholder="80000-000" span={2} required />
              </div>
            </div>
          </>)}
          <div style={{ gridColumn:"span 2", marginTop:4 }}><Btn onClick={submit} loading={loading} full>{mode==="login"?"Entrar":"Criar conta"}</Btn></div>
        </div>
        <p style={{ textAlign:"center", marginTop:20, fontFamily:"'Inconsolata',monospace", fontSize:12, color:"#444" }}>
          {mode==="login"?"Não tem conta? ":"Já tem conta? "}
          <button onClick={()=>{setMode(m=>m==="login"?"register":"login");setErrors({});setServerMsg({text:"",ok:false});}} style={{ background:"none", border:"none", color:"#b8ff57", cursor:"pointer", fontFamily:"'Inconsolata',monospace", fontSize:12, textDecoration:"underline" }}>
            {mode==="login"?"Cadastre-se":"Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ══════════════ BOOK DETAIL ══════════════ */
function BookDetail({ book: init, onBack, onToast, isAdmin, onDeleted }) {
  const [book, setBook] = useState(init);
  const [authors, setAuthors] = useState([]);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: init.name, descricao: init.description||"", preco: String(init.price),
    estoque: String(init.stock), status: init.status, idCategoria: init.category_id||"", autor: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(()=>{ apiFetch(`${API}/products/produtos/${book.id}/autores`).then(d=>{ setAuthors(d); if(d.length) setForm(f=>({...f,autor:d.map(a=>a.name).join(", ")})); }).catch(()=>{}); },[book.id]);

  const handle = e => {
    const{name,value}=e.target;
    setForm(f=>{
      const u={...f,[name]:value};
      if(name==="estoque") u.status=deriveStatus(value,f.status);
      return u;
    });
    if(errors[name]) setErrors(er=>({...er,[name]:null}));
  };
  const blur = (n,vk) => () => { const err=V[vk]?.(form[n]); setErrors(er=>({...er,[n]:err||null})); };

  const save = async () => {
    const e = validate([["nome","titulo"],["preco","preco"],["estoque","estoque"],["autor","autor"]], form);
    if(Object.keys(e).length){setErrors(e);return;}
    const finalStatus = deriveStatus(form.estoque, form.status);
    setLoading(true);
    try {
      await apiFetch(`${API}/products/produtos/${book.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.nome.trim(),descricao:form.descricao,estoque:Number(form.estoque),preco:Number(form.preco),status:finalStatus,idCategoria:form.idCategoria||null})});
      // update author
      if(form.autor.trim()) await apiFetch(`${API}/products/autores`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.autor.trim(),productId:book.id})});
      // update cover
      if(cover){const fd=new FormData();fd.append("cover",cover);await fetch(`${API}/products/produtos/${book.id}/cover`,{method:"PUT",body:fd});}
      const list = await apiFetch(`${API}/products/produtos`);
      const found = list.find(p=>p.id===book.id);
      if(found) setBook(found);
      setEditing(false); setCover(null);
      onToast("Livro atualizado!","ok");
    } catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  const del = async () => {
    setLoading(true);
    try{
      await apiFetch(`${API}/products/produtos/${book.id}`,{method:"DELETE"});
      onToast("Livro removido!","ok"); onDeleted?.(); onBack();
    }catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  const canBuy = book.status==="active" && book.stock>0;

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      {confirm && <ConfirmModal msg={`Remover "${book.name}"? Esta ação não pode ser desfeita.`} onConfirm={del} onCancel={()=>setConfirm(false)} />}
      <BackBtn onClick={onBack} />
      <div style={{ display:"grid", gridTemplateColumns:"clamp(100px,16vw,180px) 1fr", gap:"clamp(16px,4vw,48px)", alignItems:"start" }}>
        <div>
          <Cover src={book.cover_image} size={180} />
          {isAdmin && editing && (
            <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:10, padding:"7px 10px", border:"1px dashed #2a2a2a", borderRadius:2, cursor:"pointer", color:cover?"#b8ff57":"#444", fontFamily:"'Inconsolata',monospace", fontSize:11 }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={e=>setCover(e.target.files[0])} />
              {cover?`✓ ${cover.name}`:"+ Nova capa"}
            </label>
          )}
        </div>

        <div>
          {isAdmin && editing ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:20 }}>
              <Field label="Título" name="nome" value={form.nome} onChange={handle} onBlur={blur("nome","titulo")} error={errors.nome} placeholder="Dom Casmurro" span={2} required />
              <Field label="Autor" name="autor" value={form.autor} onChange={handle} onBlur={blur("autor","autor")} error={errors.autor} placeholder="Machado de Assis" span={2} required />
              <Field label="Descrição" name="descricao" as="textarea" value={form.descricao} onChange={handle} placeholder="Sinopse..." span={2} />
              <Field label="Preço (R$)" name="preco" type="number" value={form.preco} onChange={handle} onBlur={blur("preco","preco")} error={errors.preco} hint={!errors.preco&&form.preco!==""?fmt(form.preco):undefined} placeholder="0 = FREE" required />
              <Field label="Estoque" name="estoque" type="number" value={form.estoque} onChange={handle} onBlur={blur("estoque","estoque")} error={errors.estoque} hint={!errors.estoque&&form.estoque!==""?`Status: ${deriveStatus(form.estoque,form.status)}`:undefined} placeholder="0" required />
              <Field label="ID Categoria" name="idCategoria" value={form.idCategoria} onChange={handle} placeholder="1 (opcional)" />
              <Field label="Status" name="status" as="select" value={form.status} onChange={handle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of stock</option>
              </Field>
            </div>
          ) : (
            <>
              <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{authors.map(a=>a.name).join(", ")||"Autor desconhecido"}</p>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,4vw,44px)", color:"#f0ece4", lineHeight:1.1, marginBottom:14 }}>{book.name}</h1>
              {book.description && <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:14, color:"#666", lineHeight:1.8, marginBottom:20, maxWidth:500 }}>{book.description}</p>}
              <div style={{ display:"flex", gap:24, marginBottom:20, flexWrap:"wrap", alignItems:"baseline" }}>
                <div><div style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Preço</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,3vw,32px)", color:Number(book.price)===0?"#7eb8ff":"#b8ff57", fontWeight:700 }}>{fmt(book.price)}</div></div>
                <div><div style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Estoque</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,3vw,32px)", color:book.stock>0?"#f0ece4":"#ff6b6b" }}>{book.stock} un.</div></div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
                <Tag color={statusColor[book.status]||"#888"}>{book.status}</Tag>
                {book.category_name && <Tag color="#7eb8ff">{book.category_name}</Tag>}
              </div>
            </>
          )}

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {isAdmin ? (
              editing ? <><Btn onClick={save} loading={loading}>Salvar</Btn><Btn onClick={()=>{setEditing(false);setCover(null);}} variant="ghost">Cancelar</Btn></>
                      : <><Btn onClick={()=>setEditing(true)}>Editar</Btn><Btn onClick={()=>setConfirm(true)} variant="danger">Remover</Btn></>
            ) : (
              <button disabled={!canBuy} onClick={()=>onToast("Funcionalidade de compra em breve!","ok")} style={{ padding:"12px 28px", background:canBuy?"#b8ff57":"#111", color:canBuy?"#0a0a0a":"#333", border:"none", borderRadius:2, cursor:canBuy?"pointer":"not-allowed", fontFamily:"'Inconsolata',monospace", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", boxShadow:canBuy?"3px 3px 0 #4a8a00":"none" }}>
                {book.status==="inactive"?"Indisponível":book.stock===0?"Esgotado":"Comprar agora"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ USER DETAIL ══════════════ */
function UserDetail({ user: init, onBack, onToast, onDeleted }) {
  const [user, setUser] = useState(init);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome:init.name||"", email:init.email||"", telefone:init.phone||"", role:init.role||"client", rua:init.street||"", cidade:init.city||"", estado:"", cep:"", numero:"", bairro:"" });
  const [errors, setErrors] = useState({});

  const handle = e => { const{name,value}=e.target; setForm(f=>({...f,[name]:value})); if(errors[name]) setErrors(er=>({...er,[name]:null})); };
  const blur = (n,vk) => () => { const err=V[vk]?.(form[n]); setErrors(er=>({...er,[n]:err||null})); };

  const save = async () => {
    const e = validate([["nome","nome"],["email","email"],["telefone","telefone"]], form);
    if(Object.keys(e).length){setErrors(e);return;}
    setLoading(true);
    try {
      await apiFetch(`${API}/users/clientes/${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.nome.trim(),email:form.email.trim(),telefone:form.telefone,role:form.role,rua:form.rua,numero:form.numero,bairro:form.bairro,cidade:form.cidade,estado:form.estado,cep:form.cep})});
      setUser(u=>({...u,name:form.nome.trim(),email:form.email.trim(),phone:form.telefone,role:form.role,street:form.rua,city:form.cidade}));
      setEditing(false);
      onToast("Usuário atualizado!","ok");
    }catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  const del = async () => {
    setLoading(true);
    try{
      await apiFetch(`${API}/users/clientes/${user.id}`,{method:"DELETE"});
      onToast("Usuário removido!","ok"); onDeleted?.(); onBack();
    }catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      {confirm && <ConfirmModal msg={`Remover "${user.name}"? Esta ação não pode ser desfeita.`} onConfirm={del} onCancel={()=>setConfirm(false)} />}
      <BackBtn onClick={onBack} />
      <div style={{ maxWidth:560 }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"#111", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#b8ff57", marginBottom:16 }}>{user.name?.charAt(0).toUpperCase()}</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(26px,4vw,36px)", color:"#f0ece4", marginBottom:8 }}>{user.name}</h1>
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          <Tag color={user.role==="admin"?"#ff9f43":"#7eb8ff"}>{user.role}</Tag>
          <Tag color={user.active?"#b8ff57":"#ff6b6b"}>{user.active?"Ativo":"Inativo"}</Tag>
        </div>

        {editing ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:20, background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:3, padding:"clamp(14px,3vw,20px)" }}>
            <Field label="Nome" name="nome" value={form.nome} onChange={handle} onBlur={blur("nome","nome")} error={errors.nome} placeholder="João Silva" span={2} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handle} onBlur={blur("email","email")} error={errors.email} placeholder="joao@email.com" span={2} required />
            <Field label="Telefone" name="telefone" value={form.telefone} onChange={handle} onBlur={blur("telefone","telefone")} error={errors.telefone} placeholder="(41) 99999-9999" />
            <Field label="Role" name="role" as="select" value={form.role} onChange={handle}>
              <option value="client">Client</option><option value="admin">Admin</option>
            </Field>
            <div style={{ gridColumn:"span 2", borderTop:"1px solid #1a1a1a", paddingTop:14 }}>
              <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Endereço</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
                <Field label="Rua" name="rua" value={form.rua} onChange={handle} onBlur={blur("rua","rua")} error={errors.rua} placeholder="Rua das Flores" span={2} />
                <Field label="Número" name="numero" value={form.numero} onChange={handle} placeholder="123" />
                <Field label="Bairro" name="bairro" value={form.bairro} onChange={handle} placeholder="Centro" />
                <Field label="Cidade" name="cidade" value={form.cidade} onChange={handle} onBlur={blur("cidade","cidade")} error={errors.cidade} placeholder="Curitiba" />
                <Field label="Estado" name="estado" value={form.estado} onChange={handle} placeholder="PR" />
                <Field label="CEP" name="cep" value={form.cep} onChange={handle} placeholder="80000-000" span={2} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:1, background:"#1a1a1a", border:"1px solid #1a1a1a", borderRadius:3, overflow:"hidden", marginBottom:24 }}>
            {[["Email",user.email],["Telefone",user.phone||"—"],["Cidade",user.city||"—"],["Rua",user.street||"—"]].map(([l,v])=>(
              <div key={l} style={{ background:"#0d0d0d", padding:"13px 16px" }}>
                <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, color:"#ccc", wordBreak:"break-all" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {editing ? <><Btn onClick={save} loading={loading}>Salvar</Btn><Btn onClick={()=>setEditing(false)} variant="ghost">Cancelar</Btn></>
                   : <><Btn onClick={()=>setEditing(true)}>Editar</Btn><Btn onClick={()=>setConfirm(true)} variant="danger">Remover</Btn></>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ BOOKS LIST ══════════════ */
function BooksList({ onSelect, isAdmin }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => { setLoading(true); apiFetch(`${API}/products/produtos`).then(d=>{setBooks(d);setLoading(false);}).catch(()=>setLoading(false)); };
  useEffect(load,[]);

  const filtered = books
    .filter(b=>isAdmin?true:b.status==="active")
    .filter(b=>b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom:20 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar livros por título..." /></div>
      {loading ? <Spinner /> : filtered.length===0
        ? <p style={{ fontFamily:"'Inconsolata',monospace", color:"#444", padding:"40px 0" }}>Nenhum livro encontrado.</p>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"clamp(10px,2vw,20px)" }}>
            {filtered.map((b,i)=>(
              <div key={b.id} onClick={()=>onSelect(b,load)} style={{ cursor:"pointer", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:3, overflow:"hidden", transition:"transform .15s, border-color .15s", animation:`fadeUp .3s ease ${i*.03}s both`, opacity:b.status==="inactive"&&!isAdmin?.4:1 }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="#b8ff57";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="#1a1a1a";}}>
                <div style={{ background:"#111", display:"flex", justifyContent:"center", padding:"12px 12px 0" }}><Cover src={b.cover_image} size={90} /></div>
                <div style={{ padding:"10px 12px 14px" }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#f0ece4", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</p>
                  <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, color:Number(b.price)===0?"#7eb8ff":"#b8ff57", marginBottom:4 }}>{fmt(b.price)}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#444" }}>{b.stock} un.</span>
                    <Tag color={statusColor[b.status]||"#888"}>{b.status}</Tag>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

/* ══════════════ USERS LIST ══════════════ */
function UsersList({ onSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => { setLoading(true); apiFetch(`${API}/users/clientes`).then(d=>{setUsers(d);setLoading(false);}).catch(()=>setLoading(false)); };
  useEffect(load,[]);

  const filtered = users.filter(u=>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom:16 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou email..." /></div>
      {loading ? <Spinner /> : filtered.length===0
        ? <p style={{ fontFamily:"'Inconsolata',monospace", color:"#444" }}>Nenhum usuário encontrado.</p>
        : <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {filtered.map((u,i)=>(
              <div key={u.id} onClick={()=>onSelect(u,load)} style={{ display:"grid", gridTemplateColumns:"36px 1fr auto auto", alignItems:"center", gap:"clamp(8px,2vw,18px)", padding:"12px clamp(10px,2vw,16px)", background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:2, cursor:"pointer", transition:"border-color .15s", animation:`fadeUp .3s ease ${i*.03}s both` }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#b8ff57"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1a1a1a"}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#111", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:"#b8ff57", flexShrink:0 }}>{u.name?.charAt(0).toUpperCase()}</div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#f0ece4", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</p>
                  <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, color:"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</p>
                </div>
                <Tag color={u.role==="admin"?"#ff9f43":"#7eb8ff"}>{u.role}</Tag>
                <Tag color={u.active?"#b8ff57":"#ff6b6b"}>{u.active?"Ativo":"Inativo"}</Tag>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

/* ══════════════ CREATE FORMS ══════════════ */
function CreateBook({ onToast, onDone }) {
  const [form, setForm] = useState({ nome:"", descricao:"", estoque:"", preco:"", status:"active", idCategoria:"", autor:"" });
  const [errors, setErrors] = useState({});
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = e => {
    const{name,value}=e.target;
    setForm(f=>{const u={...f,[name]:value};if(name==="estoque")u.status=deriveStatus(value,f.status);return u;});
    if(errors[name]) setErrors(er=>({...er,[name]:null}));
  };
  const blur = (n,vk) => () => { const err=V[vk]?.(form[n]); setErrors(er=>({...er,[n]:err||null})); };

  const submit = async () => {
    const e = validate([["nome","titulo"],["preco","preco"],["estoque","estoque"],["autor","autor"]], form);
    if(Object.keys(e).length){setErrors(e);return;}
    const finalStatus = deriveStatus(form.estoque, form.status);
    setLoading(true);
    try{
      await apiFetch(`${API}/products/produtos`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.nome.trim(),descricao:form.descricao,estoque:Number(form.estoque),preco:Number(form.preco),status:finalStatus,idCategoria:form.idCategoria||null})});
      const list = await apiFetch(`${API}/products/produtos`);
      const created = list.find(p=>p.name===form.nome.trim());
      if(created){
        if(form.autor.trim()) await apiFetch(`${API}/products/autores`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.autor.trim(),productId:created.id})});
        if(cover){const fd=new FormData();fd.append("cover",cover);await fetch(`${API}/products/produtos/${created.id}/cover`,{method:"PUT",body:fd});}
      }
      onToast("Livro cadastrado!","ok"); onDone();
    }catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  return (
    <div>
      <BackBtn onClick={onDone} label="← CANCELAR" />
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,4vw,32px)", color:"#f0ece4", marginBottom:24 }}>Novo livro</h2>
      <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:3, padding:"clamp(14px,3vw,28px)", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, maxWidth:680 }}>
        <Field label="Título" name="nome" value={form.nome} onChange={handle} onBlur={blur("nome","titulo")} error={errors.nome} placeholder="Dom Casmurro" span={2} required />
        <Field label="Autor" name="autor" value={form.autor} onChange={handle} onBlur={blur("autor","autor")} error={errors.autor} placeholder="Machado de Assis" span={2} required />
        <Field label="Descrição" name="descricao" as="textarea" value={form.descricao} onChange={handle} placeholder="Sinopse..." span={2} />
        <Field label="Preço (R$)" name="preco" type="number" value={form.preco} onChange={handle} onBlur={blur("preco","preco")} error={errors.preco} hint={!errors.preco&&form.preco!==""?fmt(form.preco):undefined} placeholder="0 = FREE" required />
        <Field label="Estoque" name="estoque" type="number" value={form.estoque} onChange={handle} onBlur={blur("estoque","estoque")} error={errors.estoque} hint={!errors.estoque&&form.estoque!==""?`→ ${deriveStatus(form.estoque,form.status)}`:undefined} placeholder="0" required />
        <Field label="ID Categoria" name="idCategoria" value={form.idCategoria} onChange={handle} placeholder="1 (opcional)" />
        <Field label="Status" name="status" as="select" value={form.status} onChange={handle}>
          <option value="active">Active</option><option value="inactive">Inactive</option><option value="out_of_stock">Out of stock</option>
        </Field>
        <div style={{ gridColumn:"span 2" }}>
          <label style={{ display:"block", fontFamily:"'Inconsolata',monospace", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:6, color:"#444" }}>Capa</label>
          <label style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", border:"1px dashed #1e1e1e", borderRadius:2, cursor:"pointer", color:cover?"#b8ff57":"#333", fontFamily:"'Inconsolata',monospace", fontSize:13 }}>
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={e=>setCover(e.target.files[0])} />
            {cover?`✓ ${cover.name}`:"+ Selecionar imagem"}
          </label>
        </div>
        <div style={{ gridColumn:"span 2" }}><Btn onClick={submit} loading={loading} full>Cadastrar livro</Btn></div>
      </div>
    </div>
  );
}

function CreateUser({ onToast, onDone }) {
  const [form, setForm] = useState({ nome:"", email:"", password:"", telefone:"", role:"client", rua:"", numero:"", bairro:"", cidade:"", estado:"", cep:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = e => { const{name,value}=e.target; setForm(f=>({...f,[name]:value})); if(errors[name]) setErrors(er=>({...er,[name]:null})); };
  const blur = (n,vk) => () => { const err=V[vk]?.(form[n]); setErrors(er=>({...er,[n]:err||null})); };

  const submit = async () => {
    const e = validate([["nome","nome"],["email","email"],["password","password"],["telefone","telefone"],["rua","rua"],["cidade","cidade"],["estado","estado"],["cep","cep"]], form);
    if(Object.keys(e).length){setErrors(e);return;}
    setLoading(true);
    try{
      await apiFetch(`${API}/users/clientes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome:form.nome.trim(),email:form.email.trim(),password:form.password,telefone:form.telefone,role:form.role,endereco:{rua:form.rua.trim(),numero:form.numero,bairro:form.bairro,cidade:form.cidade.trim(),estado:form.estado.trim(),cep:form.cep.trim()}})});
      onToast("Usuário cadastrado!","ok"); onDone();
    }catch(err){onToast(err.message,"error");}
    setLoading(false);
  };

  return (
    <div>
      <BackBtn onClick={onDone} label="← CANCELAR" />
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,4vw,32px)", color:"#f0ece4", marginBottom:24 }}>Novo usuário</h2>
      <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:3, padding:"clamp(14px,3vw,28px)", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, maxWidth:680 }}>
        <Field label="Nome" name="nome" value={form.nome} onChange={handle} onBlur={blur("nome","nome")} error={errors.nome} placeholder="João Silva" span={2} required />
        <Field label="Email" name="email" type="email" value={form.email} onChange={handle} onBlur={blur("email","email")} error={errors.email} placeholder="joao@email.com" required />
        <Field label="Senha" name="password" type="password" value={form.password} onChange={handle} onBlur={blur("password","password")} error={errors.password} placeholder="••••••" required />
        <Field label="Telefone" name="telefone" value={form.telefone} onChange={handle} onBlur={blur("telefone","telefone")} error={errors.telefone} placeholder="(41) 99999-9999" />
        <Field label="Role" name="role" as="select" value={form.role} onChange={handle}>
          <option value="client">Client</option><option value="admin">Admin</option>
        </Field>
        <div style={{ gridColumn:"span 2", borderTop:"1px solid #1a1a1a", paddingTop:16 }}>
          <p style={{ fontFamily:"'Inconsolata',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Endereço</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
            <Field label="Rua" name="rua" value={form.rua} onChange={handle} onBlur={blur("rua","rua")} error={errors.rua} placeholder="Rua das Flores" span={2} required />
            <Field label="Número" name="numero" value={form.numero} onChange={handle} placeholder="123" />
            <Field label="Bairro" name="bairro" value={form.bairro} onChange={handle} placeholder="Centro" />
            <Field label="Cidade" name="cidade" value={form.cidade} onChange={handle} onBlur={blur("cidade","cidade")} error={errors.cidade} placeholder="Curitiba" required />
            <Field label="Estado" name="estado" value={form.estado} onChange={handle} onBlur={blur("estado","estado")} error={errors.estado} placeholder="PR" required />
            <Field label="CEP" name="cep" value={form.cep} onChange={handle} onBlur={blur("cep","cep")} error={errors.cep} placeholder="80000-000" span={2} required />
          </div>
        </div>
        <div style={{ gridColumn:"span 2" }}><Btn onClick={submit} loading={loading} full>Cadastrar usuário</Btn></div>
      </div>
    </div>
  );
}

/* ══════════════ APP SHELL ══════════════ */
function AppShell({ user, onLogout, onToast, isAdmin, viewMode, setViewMode }) {
  const [tab, setTab] = useState("livros");
  const [page, setPage] = useState("list");
  const [selected, setSelected] = useState(null);
  const [reloadFn, setReloadFn] = useState(null);

  const goDetail = (item, reload) => { setSelected(item); setReloadFn(()=>reload); setPage("detail"); };
  const goBack = () => { setPage("list"); setSelected(null); };

  return (
    <div style={{ minHeight:"100vh", background:"#080808" }}>
      <header style={{ borderBottom:"1px solid #141414", padding:"0 clamp(12px,3vw,48px)", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, background:"#080808", zIndex:100, gap:10 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, flexShrink:0 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(16px,2.5vw,20px)", color:"#f0ece4", fontWeight:700 }}>Biblioteca</span>
          {isAdmin&&viewMode==="admin"&&<span style={{ fontFamily:"'Inconsolata',monospace", fontSize:9, color:"#ff9f43", letterSpacing:3, textTransform:"uppercase" }}>admin</span>}
        </div>

        {viewMode==="admin" && page==="list" && (
          <nav style={{ display:"flex", overflow:"hidden" }}>
            {["livros","usuários"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setPage("list");setSelected(null);}} style={{ padding:"0 clamp(8px,2vw,14px)", height:56, background:"none", border:"none", borderBottom:tab===t?"2px solid #b8ff57":"2px solid transparent", color:tab===t?"#b8ff57":"#444", cursor:"pointer", fontFamily:"'Inconsolata',monospace", fontSize:11, letterSpacing:1.5, textTransform:"uppercase", transition:"color .15s", whiteSpace:"nowrap" }}>{t}</button>
            ))}
          </nav>
        )}

        <UserChip user={user} onLogout={onLogout} isAdmin={isAdmin} viewMode={viewMode} setViewMode={(fn)=>{setViewMode(fn);setPage("list");setSelected(null);setTab("livros");}} />
      </header>

      <main style={{ padding:"clamp(12px,3vw,48px)" }}>
        {page==="detail" && selected && (tab==="livros"||viewMode==="client") && <BookDetail book={selected} onBack={goBack} onToast={onToast} isAdmin={isAdmin&&viewMode==="admin"} onDeleted={reloadFn} />}
        {page==="detail" && selected && tab==="usuários" && viewMode==="admin" && <UserDetail user={selected} onBack={goBack} onToast={onToast} onDeleted={reloadFn} />}
        {page==="create" && viewMode==="admin" && tab==="livros" && <CreateBook onToast={onToast} onDone={()=>setPage("list")} />}
        {page==="create" && viewMode==="admin" && tab==="usuários" && <CreateUser onToast={onToast} onDone={()=>setPage("list")} />}
        {page==="list" && (
          <>
            {(viewMode==="client"||tab==="livros") && (
              <div>
                {viewMode==="admin" && <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}><Btn onClick={()=>setPage("create")}>+ Novo livro</Btn></div>}
                <BooksList onSelect={goDetail} isAdmin={isAdmin&&viewMode==="admin"} />
              </div>
            )}
            {viewMode==="admin" && tab==="usuários" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px,4vw,32px)", color:"#f0ece4" }}>Usuários</h2>
                  <Btn onClick={()=>setPage("create")}>+ Novo usuário</Btn>
                </div>
                <UsersList onSelect={goDetail} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ══════════════ ROOT ══════════════ */
export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [viewMode, setViewMode] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? (JSON.parse(s).role==="admin"?"admin":"client") : "client"; } catch { return "client"; }
  });
  const [toast, setToast] = useState({ msg:"", type:"ok" });

  const onToast = (msg,type) => { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"ok"}),3000); };
  const onLogin = (u) => { setUser(u); setViewMode(u.role==="admin"?"admin":"client"); };
  const onLogout = () => { localStorage.removeItem(STORAGE_KEY); setUser(null); setViewMode("client"); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inconsolata:wght@400;600;700&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html,body,#root{width:100%;min-height:100vh;}
        body{background:#080808;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080808}::-webkit-scrollbar-thumb{background:#222}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
        @media(max-width:480px){
          .hide-sm{display:none!important;}
        }
      `}</style>
      {!user ? <LoginPage onLogin={onLogin} /> : <AppShell user={user} onLogout={onLogout} onToast={onToast} isAdmin={user.role==="admin"} viewMode={viewMode} setViewMode={setViewMode} />}
      <Toast msg={toast.msg} type={toast.type} />
    </>
  );
}