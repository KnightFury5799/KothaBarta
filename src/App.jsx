import { useState, useEffect } from "react";

const SUPABASE_URL = "https://feutzrvftthiznokkfhx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldXR6cnZmdHRoaXpub2trZmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTM5MzgsImV4cCI6MjA5MDM4OTkzOH0.eHcdpGzHM6ffrXx-WrxxwRbvN8nX2ijtyUUQ3ItKt60";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "",
      ...options.headers,
    },
    ...options,
  });
  if (options.noBody) return res;
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const DB = {
  async getUser(username) {
    const data = await sb(`users?username=eq.${username.toLowerCase()}&limit=1`);
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },
  async createUser(user) {
    return await sb("users", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ username: user.username.toLowerCase(), display_name: user.displayName, password: user.password }),
    });
  },
  async getMessages(username) {
    const data = await sb(`messages?to_username=eq.${username.toLowerCase()}&order=created_at.desc`);
    return Array.isArray(data) ? data : [];
  },
  async addMessage(username, text) {
    return await sb("messages", { method: "POST", body: JSON.stringify({ to_username: username.toLowerCase(), text }) });
  },
  async markRead(id) {
    return await sb(`messages?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
  },
  async deleteMessage(id) {
    return await sb(`messages?id=eq.${id}`, { method: "DELETE", noBody: true });
  },
};

const T = { bg:"#08060F", card:"#110E22", border:"#2A2448", accent:"#F0A500", rose:"#E06080", text:"#F5EFE0", muted:"#7A7295", faint:"#3A3560" };

function Toast({ note }) {
  if (!note) return null;
  const bg  = note.type==="success" ? "#1a3a20" : note.type==="error" ? "#3a1020" : "#1a1a3a";
  const bdr = note.type==="success" ? "#4CAF7050" : note.type==="error" ? "#E0608050" : "#7A729550";
  return <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:bg,border:`1px solid ${bdr}`,borderRadius:12,padding:"12px 18px",color:T.text,fontSize:13,maxWidth:280,animation:"slideDown 0.3s ease",boxShadow:"0 8px 32px #00000060" }}>{note.msg}</div>;
}

function Input({ value, onChange, placeholder, type="text", onKeyDown, rows }) {
  const [focus, setFocus] = useState(false);
  const s = { background:"#0D0A1E", border:`1px solid ${focus ? T.accent+"80" : T.border}`, borderRadius:10, padding:"12px 16px", color:T.text, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"border 0.2s", outline:"none", width:"100%" };
  if (rows) return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{...s,lineHeight:1.7,resize:"vertical"}} />;
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} onKeyDown={onKeyDown} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={s} />;
}

function Btn({ children, onClick, variant="primary", disabled, loading, small }) {
  const base = { borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontWeight:500, cursor:disabled||loading?"not-allowed":"pointer", transition:"all 0.2s", padding:small?"8px 16px":"12px 22px", fontSize:small?13:14, opacity:disabled||loading?0.5:1, border:"none", display:"inline-flex", alignItems:"center", gap:6 };
  const styles = { primary:{...base,background:T.accent,color:"#08060F"}, ghost:{...base,background:"transparent",color:T.muted,border:`1px solid ${T.border}`} };
  return <button onClick={onClick} disabled={disabled||loading} style={styles[variant]||styles.primary}>{loading?"…":children}</button>;
}

function MsgCard({ msg, onDelete, onRead }) {
  const timeStr = new Date(msg.created_at).toLocaleString("en-BD",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  return (
    <div onClick={()=>onRead(msg.id)} style={{ background:msg.read?T.card:"#161240", border:`1px solid ${msg.read?T.border:T.accent+"40"}`, borderRadius:14, padding:"18px 20px", marginBottom:12, cursor:"pointer", transition:"all 0.2s", position:"relative", animation:"fadeIn 0.35s ease" }}>
      {!msg.read && <div style={{ position:"absolute",top:14,right:16,width:8,height:8,borderRadius:"50%",background:T.accent,boxShadow:`0 0 8px ${T.accent}` }} />}
      <p style={{ color:T.text,fontSize:15,lineHeight:1.7,marginBottom:10 }}>{msg.text}</p>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ color:T.muted,fontSize:12 }}>{timeStr}</span>
        <button onClick={e=>{e.stopPropagation();onDelete(msg.id);}} style={{ color:T.rose,fontSize:11,background:"none",border:"none",cursor:"pointer",opacity:0.7 }}>delete</button>
      </div>
    </div>
  );
}

export default function App() {
  const [view,setView]=useState("landing");
  const [authMode,setAuthMode]=useState("login");
  const [currentUser,setCurrentUser]=useState(null);
  const [messages,setMessages]=useState([]);
  const [note,setNote]=useState(null);
  const [loading,setLoading]=useState(false);
  const [uname,setUname]=useState("");
  const [dname,setDname]=useState("");
  const [pass,setPass]=useState("");
  const [sendTo,setSendTo]=useState("");
  const [sendMsg,setSendMsg]=useState("");
  const [sendTarget,setSendTarget]=useState(null);
  const [lookingUp,setLookingUp]=useState(false);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("kb_session");
    if(saved){const u=JSON.parse(saved);setCurrentUser(u);loadMsgs(u.username);setView("dashboard");}
  },[]);

  const notify=(msg,type="info")=>{setNote({msg,type});setTimeout(()=>setNote(null),3200);};
  const loadMsgs=async(username)=>{const msgs=await DB.getMessages(username);setMessages(msgs);};

  const handleAuth=async()=>{
    if(!uname.trim()||!pass.trim()) return notify("Please fill all fields","error");
    if(authMode==="signup"&&!dname.trim()) return notify("Enter your display name","error");
    setLoading(true);
    try{
      if(authMode==="login"){
        const user=await DB.getUser(uname);
        if(!user||user.password!==pass){setLoading(false);return notify("Incorrect username or password","error");}
        const u={username:user.username,displayName:user.display_name};
        setCurrentUser(u);localStorage.setItem("kb_session",JSON.stringify(u));
        await loadMsgs(u.username);setView("dashboard");notify(`Welcome back, ${u.displayName}! 🌙`,"success");
      } else {
        if(uname.length<3){setLoading(false);return notify("Username needs 3+ characters","error");}
        if(!/^[a-z0-9_]+$/i.test(uname)){setLoading(false);return notify("Letters, numbers & underscore only","error");}
        const existing=await DB.getUser(uname);
        if(existing){setLoading(false);return notify("That username is taken","error");}
        await DB.createUser({username:uname,displayName:dname,password:pass});
        const u={username:uname.toLowerCase(),displayName:dname};
        setCurrentUser(u);localStorage.setItem("kb_session",JSON.stringify(u));
        setMessages([]);setView("dashboard");notify(`Welcome to kothabarta, ${dname}! ✨`,"success");
      }
    } catch { notify("Something went wrong. Try again.","error"); }
    setLoading(false);
  };

  const handleLookup=async()=>{
    if(!sendTo.trim()) return;
    setLookingUp(true);
    const user=await DB.getUser(sendTo);
    setLookingUp(false);
    setSendTarget(user?{username:user.username,displayName:user.display_name}:null);
    if(!user) notify("No user found with that username","error");
  };

  const handleSend=async()=>{
    if(!sendMsg.trim()) return notify("Write something first!","error");
    if(!sendTarget) return notify("Find a user first","error");
    if(sendMsg.length>500) return notify("Max 500 characters","error");
    setLoading(true);
    try{ await DB.addMessage(sendTarget.username,sendMsg.trim());setSendMsg("");setSendTarget(null);setSendTo("");setView("sent"); }
    catch{ notify("Failed to send. Try again.","error"); }
    setLoading(false);
  };

  const handleDelete=async(id)=>{await DB.deleteMessage(id);setMessages(prev=>prev.filter(m=>m.id!==id));};
  const handleRead=async(id)=>{await DB.markRead(id);setMessages(prev=>prev.map(m=>m.id===id?{...m,read:true}:m));};
  const handleLogout=()=>{setCurrentUser(null);setMessages([]);localStorage.removeItem("kb_session");setUname("");setDname("");setPass("");setView("landing");};
  const copyLink=()=>{navigator.clipboard.writeText(`${window.location.origin}/u/${currentUser.username}`);setCopied(true);setTimeout(()=>setCopied(false),2000);notify("Link copied! 💌","success");};
  const goCompose=async(username="")=>{setSendTo(username);setSendTarget(null);setSendMsg("");setView("compose");if(username){const u=await DB.getUser(username);if(u)setSendTarget({username:u.username,displayName:u.display_name});}};
  const unread=messages.filter(m=>!m.read).length;
  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",position:"relative",overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#3A3560;border-radius:2px}
        input,textarea{outline:none}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.9}}
      `}</style>
      <div style={{ position:"fixed",top:"-15%",left:"-10%",width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,#F0A50012 0%,transparent 65%)`,pointerEvents:"none",zIndex:0,animation:"glow 6s ease-in-out infinite" }} />
      <div style={{ position:"fixed",bottom:"-10%",right:"-5%",width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,#E0608010 0%,transparent 65%)`,pointerEvents:"none",zIndex:0,animation:"glow 8s ease-in-out infinite 2s" }} />
      <Toast note={note} />

      <nav style={{ position:"sticky",top:0,zIndex:100,background:"#08060FCC",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <button onClick={()=>setView(currentUser?"dashboard":"landing")} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"baseline",gap:6 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:T.accent }}>kothabarta</span>
          <span style={{ color:T.muted,fontSize:11,letterSpacing:1 }}>কথাবার্তা</span>
        </button>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {currentUser ? (
            <>
              <Btn variant="ghost" small onClick={()=>goCompose()}>+ Send</Btn>
              <div style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }} onClick={()=>setView("dashboard")}>
                <div style={{ width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${T.accent},${T.rose})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#08060F" }}>{currentUser.displayName[0].toUpperCase()}</div>
                {unread>0 && <span style={{ background:T.rose,color:"#fff",borderRadius:10,fontSize:11,padding:"1px 7px",fontWeight:600 }}>{unread}</span>}
              </div>
            </>
          ) : (
            <>
              <Btn variant="ghost" small onClick={()=>{setAuthMode("login");setView("auth");}}>Log in</Btn>
              <Btn small onClick={()=>{setAuthMode("signup");setView("auth");}}>Get your link</Btn>
            </>
          )}
        </div>
      </nav>

      <div style={{ position:"relative",zIndex:1 }}>

        {view==="landing" && (
          <div style={{ maxWidth:600,margin:"0 auto",padding:"80px 24px 40px",animation:"fadeIn 0.5s ease" }}>
            <div style={{ textAlign:"center",marginBottom:60 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:T.accent,letterSpacing:4,textTransform:"uppercase",marginBottom:20,opacity:0.8 }}>anonymous messaging</div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,8vw,56px)",fontWeight:500,lineHeight:1.15,marginBottom:18,color:T.text }}>Say what you<br /><em style={{ color:T.accent }}>really</em> feel</h1>
              <p style={{ color:T.muted,fontSize:16,lineHeight:1.7,maxWidth:420,margin:"0 auto 40px" }}>Share your link. Receive honest, anonymous messages from anyone. No account needed to send.</p>
              <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
                <Btn onClick={()=>{setAuthMode("signup");setView("auth");}}>Get my link →</Btn>
                <Btn variant="ghost" onClick={()=>goCompose()}>Send to someone</Btn>
              </div>
            </div>
            <div style={{ textAlign:"center",margin:"40px 0",opacity:0.12,fontFamily:"'Cormorant Garamond',serif",fontSize:28,letterSpacing:12,color:T.accent }}>কথাবার্তা</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16 }}>
              {[["🔒","Anonymous","Senders stay completely hidden"],["⚡","Instant","Messages land right away"],["🔗","One link","Share anywhere — IG, Discord, WhatsApp"]].map(([icon,title,desc])=>(
                <div key={title} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 16px",textAlign:"center" }}>
                  <div style={{ fontSize:24,marginBottom:8 }}>{icon}</div>
                  <div style={{ fontWeight:500,fontSize:14,marginBottom:6,color:T.text }}>{title}</div>
                  <div style={{ color:T.muted,fontSize:12,lineHeight:1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view==="auth" && (
          <div style={{ maxWidth:420,margin:"60px auto",padding:"0 24px",animation:"fadeIn 0.4s ease" }}>
            <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32 }}>
              <div style={{ textAlign:"center",marginBottom:28 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:500,marginBottom:6 }}>{authMode==="login"?"Welcome back":"Join kothabarta"}</h2>
                <p style={{ color:T.muted,fontSize:13 }}>{authMode==="login"?"Log in to see your messages":"Create your anonymous inbox"}</p>
              </div>
              <div style={{ display:"flex",background:"#0D0A1E",borderRadius:10,padding:4,marginBottom:24 }}>
                {["login","signup"].map(m=>(
                  <button key={m} onClick={()=>setAuthMode(m)} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",fontSize:13,fontWeight:500,background:authMode===m?T.accent:"transparent",color:authMode===m?"#08060F":T.muted,cursor:"pointer",transition:"all 0.2s" }}>{m==="login"?"Log in":"Sign up"}</button>
                ))}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <Input value={uname} onChange={setUname} placeholder="username" onKeyDown={e=>e.key==="Enter"&&handleAuth()} />
                {authMode==="signup" && <Input value={dname} onChange={setDname} placeholder="display name" />}
                <Input value={pass} onChange={setPass} placeholder="password" type="password" onKeyDown={e=>e.key==="Enter"&&handleAuth()} />
                <Btn onClick={handleAuth} loading={loading}>{authMode==="login"?"Log in →":"Create account →"}</Btn>
              </div>
              <p style={{ color:T.muted,fontSize:12,textAlign:"center",marginTop:16,lineHeight:1.6 }}>
                {authMode==="signup"?"Your link will be shown after signup":<span>No account?{" "}<button onClick={()=>setAuthMode("signup")} style={{ color:T.accent,background:"none",border:"none",cursor:"pointer",fontSize:12 }}>Sign up</button></span>}
              </p>
            </div>
          </div>
        )}

        {view==="dashboard" && currentUser && (
          <div style={{ maxWidth:600,margin:"0 auto",padding:"32px 24px",animation:"fadeIn 0.4s ease" }}>
            <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:24,marginBottom:24 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500 }}>{currentUser.displayName}</div>
                  <div style={{ color:T.muted,fontSize:13 }}>@{currentUser.username}</div>
                </div>
                <Btn variant="ghost" small onClick={handleLogout}>Log out</Btn>
              </div>
              <div style={{ background:"#0D0A1E",border:`1px solid #F0A50030`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
                <div>
                  <div style={{ fontSize:11,color:T.muted,marginBottom:2,letterSpacing:0.5 }}>YOUR LINK</div>
                  <div style={{ color:T.accent,fontSize:13,fontFamily:"monospace",wordBreak:"break-all" }}>{window.location.origin}/u/{currentUser.username}</div>
                </div>
                <Btn onClick={copyLink} small>{copied?"✓ Copied":"Copy"}</Btn>
              </div>
            </div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500 }}>Inbox {unread>0 && <span style={{ color:T.accent,fontSize:16 }}>({unread} new)</span>}</h3>
              <Btn variant="ghost" small onClick={()=>loadMsgs(currentUser.username)}>Refresh</Btn>
            </div>
            {messages.length===0 ? (
              <div style={{ textAlign:"center",padding:"60px 20px",color:T.muted }}>
                <div style={{ fontSize:40,marginBottom:16,animation:"float 3s ease-in-out infinite" }}>💌</div>
                <p style={{ fontSize:15,marginBottom:8 }}>Your inbox is empty</p>
                <p style={{ fontSize:13,opacity:0.7 }}>Share your link to receive anonymous messages</p>
              </div>
            ) : messages.map(msg=><MsgCard key={msg.id} msg={msg} onDelete={handleDelete} onRead={handleRead} />)}
          </div>
        )}

        {view==="compose" && (
          <div style={{ maxWidth:500,margin:"60px auto",padding:"0 24px",animation:"fadeIn 0.4s ease" }}>
            <button onClick={()=>setView(currentUser?"dashboard":"landing")} style={{ color:T.muted,background:"none",border:"none",cursor:"pointer",fontSize:13,marginBottom:24,display:"flex",alignItems:"center",gap:6 }}>← back</button>
            <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:500,marginBottom:6 }}>Send a message</h2>
              <p style={{ color:T.muted,fontSize:13,marginBottom:28 }}>100% anonymous. They will never know it is you.</p>
              {!sendTarget ? (
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12,color:T.muted,letterSpacing:0.5,display:"block",marginBottom:8 }}>USERNAME</label>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ flex:1 }}><Input value={sendTo} onChange={setSendTo} placeholder="enter their username" onKeyDown={e=>e.key==="Enter"&&handleLookup()} /></div>
                    <Btn onClick={handleLookup} loading={lookingUp}>Find</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"center",gap:12,background:"#0D0A1E",border:`1px solid #F0A50030`,borderRadius:12,padding:"12px 16px",marginBottom:20 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${T.accent},${T.rose})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#08060F",flexShrink:0 }}>{sendTarget.displayName[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500,fontSize:14,color:T.text }}>{sendTarget.displayName}</div>
                    <div style={{ color:T.muted,fontSize:12 }}>@{sendTarget.username}</div>
                  </div>
                  <button onClick={()=>{setSendTarget(null);setSendTo("");}} style={{ color:T.muted,background:"none",border:"none",cursor:"pointer",fontSize:12 }}>change</button>
                </div>
              )}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12,color:T.muted,letterSpacing:0.5,display:"block",marginBottom:8 }}>YOUR MESSAGE</label>
                <Input value={sendMsg} onChange={setSendMsg} placeholder="Write something honest, kind, or thought-provoking..." rows={5} />
                <div style={{ textAlign:"right",fontSize:12,marginTop:4,color:sendMsg.length>450?T.rose:T.muted }}>{sendMsg.length}/500</div>
              </div>
              <Btn onClick={handleSend} loading={loading} disabled={!sendTarget||sendMsg.length>500}>Send anonymously 🔒</Btn>
            </div>
          </div>
        )}

        {view==="sent" && (
          <div style={{ maxWidth:440,margin:"80px auto",padding:"0 24px",textAlign:"center",animation:"fadeIn 0.5s ease" }}>
            <div style={{ fontSize:60,marginBottom:24,animation:"float 2s ease-in-out infinite" }}>💌</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:500,marginBottom:12 }}>Message sent!</h2>
            <p style={{ color:T.muted,fontSize:15,lineHeight:1.7,marginBottom:32 }}>Your message was delivered anonymously.<br />They have no idea it was you.</p>
            <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
              <Btn onClick={()=>goCompose()}>Send another</Btn>
              <Btn variant="ghost" onClick={()=>setView(currentUser?"dashboard":"landing")}>{currentUser?"My inbox":"Home"}</Btn>
            </div>
          </div>
        )}

      </div>

      <div style={{ textAlign:"center",padding:"40px 24px 24px",color:T.faint,fontSize:12,position:"relative",zIndex:1 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:T.muted,opacity:0.4 }}>kothabarta · কথাবার্তা</span>
      </div>
    </div>
  );
}
