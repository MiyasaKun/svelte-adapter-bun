import sirv from "sirv";

const assets = sirv('public', {
    maxAge: 31536000, // 1Y
    immutable: true
}
)