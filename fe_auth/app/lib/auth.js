const data = {
    email: "admin@web.com",
    password: "admin",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const signIn = async (email, password) => {
    if (email === data.email && password === data.password) {
        return { success: true };

        // fecth api
        // option credentials
        // option cache
    }
    throw new Error("Invalid credentials");
};
