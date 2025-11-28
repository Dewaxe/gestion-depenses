import { type ReactNode } from "react";

type CardProps = {
    children: ReactNode;
};

function Card({ children }: CardProps) {
    return (
        <div
            style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
            >
            {children}
        </div>
    );
}

export default Card;
