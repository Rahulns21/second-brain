function required(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env variable: ${name}`)
    }
    return value;
}

export const config = {
    PORT: process.env.PORT || "3000",
    DB_URL: required("DB_URL"),
    JWT_SECRET: required("JWT_SECRET")
}