type PageTitleProps = {
    title: string;
    subtitle?: string;
};

function PageTitle({ title, subtitle }: PageTitleProps) {
    return (
        <header
        style={{
            textAlign: "center",
            marginBottom: "2rem",
        }}
        >
        <h1>{title}</h1>
        {subtitle && (
            <p
            style={{
                marginTop: "0.5rem",
                fontSize: "0.95rem",
                color: "#555",
            }}
            >
            {subtitle}
            </p>
        )}
        </header>
    );
}

export default PageTitle;
