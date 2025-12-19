
interface Props {
    onClick: () => void
}

export default function ExitButton({onClick}: Props) {
    return(
        <button
            style={{
                position: "fixed",
                top: 12,
                right: 12,
                zIndex: 99999,
                padding: "10px 20px",
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                pointerEvents: "auto",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.7)",
                transition: "all 0.2s",
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
            }}
        >
            ✕ EXIT
        </button>
    )
}