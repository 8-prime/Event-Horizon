
export type PropertyDetailsProps = {
    k: string,
    v: string
}


const PropertyDetail = ({ k, v }: PropertyDetailsProps) => {

    const legalV = typeof v === "string" ? v : JSON.stringify(v, null, 2)

    return (
        <div>
            <div className="text-sm font-medium">{k}</div>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {legalV}
            </pre>
        </div>
    )
}

export default PropertyDetail;
