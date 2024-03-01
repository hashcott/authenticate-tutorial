"use server";

import { signIn } from "@/app/lib/auth";

export async function authenticate(_currentState, formData) {
    const emailTxt = formData.get("emailTxt");
    const passwordTxt = formData.get("passwordTxt");
    console.log(emailTxt);

    try {
        await signIn(emailTxt, passwordTxt);
        // work correctly
        return "Welcome!";
    } catch (error) {
        return "Invalid credentials, Ooops! Try again.";
    }
}
