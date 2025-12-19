interface Props {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmModal ({
    open,
    onCancel,
    onConfirm
}: Props) {
    if(!open) return null;
    return(
        <div style={{
            position: "fixed" as const,
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100000,
            pointerEvents: "auto",
        }}>
            <div style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                textAlign: "center" as const,
            }}>
                <p>게임을 종료하시겠습니까?</p>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={onCancel}>취소</button>
                    <button onClick={onConfirm}>확인</button>
                </div>
            </div>
        </div>
    )
}