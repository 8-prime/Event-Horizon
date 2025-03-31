
export type PropertyDetailsProps = {
    k: string,
    v: string
}


const PropertDetail = ({ k, v }: PropertyDetailsProps) => {

    const legalV = typeof v === "string" ? v : JSON.stringify(v)

    return (
        <div>
            <div className="text-sm font-medium">{k}</div>
            <div className="font-mono text-sm whitespace-pre-wrap break-words">
                {legalV}
            </div>
        </div>
    )
}

export default PropertDetail;
