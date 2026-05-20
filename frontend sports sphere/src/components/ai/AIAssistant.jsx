import { useState, useRef, useEffect } from "react"
import { toast } from "react-toastify"
import { sendAIMessage } from "../../services/aiService"
import { useApp } from "../../context/AppContext"

function extractAIReply(payload) {
    const root = payload?.data ?? payload

    if (typeof root === "string") return root

    const directReply = root?.data || root?.reply || root?.response || root?.message || root?.text
    if (typeof directReply === "string" && directReply.trim()) {
        return directReply
    }

    const geminiText = root?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof geminiText === "string" && geminiText.trim()) {
        return geminiText
    }

    const choicesText = root?.choices?.[0]?.message?.content || root?.choices?.[0]?.text
    if (typeof choicesText === "string" && choicesText.trim()) {
        return choicesText
    }

    return ""
}

export default function AIAssistant() {
    const { currentUser, role } = useApp()
    const initialMessages = [
        {
            role: "assistant",
            text: "Hi! I am your SportsSphere AI assistant. I can help you find matches, book seats, manage your bookings, or answer any question about the platform. What would you like to know?"
        }
    ]

    const [open, setOpen]       = useState(false)
    const [messages, setMessages] = useState(initialMessages)
    const [input, setInput]     = useState("")
    const [loading, setLoading] = useState(false)

    const bottomRef = useRef(null)

    // auto scroll to latest message
    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, open])

    // refresh the assistant whenever auth state changes so sessions don't bleed together
    useEffect(() => {
        setOpen(false)
        setInput("")
        setLoading(false)
        setMessages(initialMessages)
    }, [currentUser, role])

    const handleSend = () => {
        const prompt = input.trim()
        if (!prompt || loading) return

        setInput("")

        // add user message to chat
        const userMsg = { role: "user", text: prompt }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        sendAIMessage(prompt)
            .then((response) => {
                const aiReply = extractAIReply(response) || "Sorry, I could not generate a response."
                setMessages(prev => [...prev, { role: "assistant", text: aiReply }])
            })
            .catch((error) => {
                const errMsg = error.response?.data?.message || "Something went wrong. Please try again."
                toast.error(errMsg)
                setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I ran into an issue. Please try again!" }])
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* ── Floating Button ─────────────────────────────── */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position:       "fixed",
                    bottom:         24,
                    right:          24,
                    zIndex:         1050,
                    width:          54,
                    height:         54,
                    borderRadius:   "50%",
                    background:     "#1D9E75",
                    color:          "#fff",
                    border:         "none",
                    cursor:         "pointer",
                    fontSize:       22,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    boxShadow:      "0 4px 16px rgba(0,0,0,0.18)"
                }}
                title="AI Assistant"
            >
                {open ? "✕" : "✦"}
            </button>

            {/* ── Chat Panel ──────────────────────────────────── */}
            {open && (
                <div style={{
                    position:     "fixed",
                    bottom:       90,
                    right:        24,
                    zIndex:       1049,
                    width:        340,
                    maxHeight:    500,
                    background:   "#fff",
                    border:       "1px solid #e5e7eb",
                    borderRadius: 16,
                    display:      "flex",
                    flexDirection:"column",
                    overflow:     "hidden",
                    boxShadow:    "0 8px 32px rgba(0,0,0,0.12)"
                }}>

                    {/* Header */}
                    <div style={{
                        padding:      "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        display:      "flex",
                        alignItems:   "center",
                        gap:          10,
                        background:   "#f9fafb"
                    }}>
                        <div style={{
                            width:          36,
                            height:         36,
                            borderRadius:   "50%",
                            background:     "#1D9E75",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            color:          "#fff",
                            fontSize:       16
                        }}>
                            ✦
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>SportsSphere AI</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>Powered by Gemini</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex:      1,
                        overflowY: "auto",
                        padding:   "14px 14px",
                        display:   "flex",
                        flexDirection: "column",
                        gap:       10
                    }}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display:        "flex",
                                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                                }}
                            >
                                <div style={{
                                    maxWidth:            "85%",
                                    padding:             "9px 13px",
                                    borderRadius:        msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                    fontSize:            13,
                                    lineHeight:          1.55,
                                    whiteSpace:          "pre-wrap",
                                    background:          msg.role === "user" ? "#1D9E75" : "#f3f4f6",
                                    color:               msg.role === "user" ? "#fff" : "#111",
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div style={{
                                    padding:    "9px 13px",
                                    borderRadius: "16px 16px 16px 4px",
                                    background: "#f3f4f6",
                                    fontSize:   13,
                                    color:      "#6b7280"
                                }}>
                                    Thinking...
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding:      "10px 12px",
                        borderTop:    "1px solid #f3f4f6",
                        display:      "flex",
                        gap:          8,
                        alignItems:   "flex-end",
                        background:   "#f9fafb"
                    }}>
                        <textarea
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            disabled={loading}
                            style={{
                                flex:       1,
                                fontSize:   13,
                                padding:    "8px 10px",
                                border:     "1px solid #e5e7eb",
                                borderRadius: 10,
                                resize:     "none",
                                outline:    "none",
                                background: "#fff",
                                color:      "#111",
                                fontFamily: "inherit",
                                lineHeight: 1.4
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{
                                padding:      "8px 14px",
                                background:   loading || !input.trim() ? "#d1d5db" : "#1D9E75",
                                color:        "#fff",
                                border:       "none",
                                borderRadius: 10,
                                fontSize:     13,
                                cursor:       loading || !input.trim() ? "not-allowed" : "pointer",
                                fontWeight:   500,
                                whiteSpace:   "nowrap"
                            }}
                        >
                            Send
                        </button>
                    </div>

                </div>
            )}
        </>
    )
}