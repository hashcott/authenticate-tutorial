"use client";

import { authenticate } from "@/app/lib/actions";

import { useFormState, useFormStatus } from "react-dom";

export default function Login() {
    const [valueReturn, dispatch] = useFormState(authenticate, undefined);
    return (
        <form action={dispatch}>
            <input type="email" name="emailTxt" />
            <input type="password" name="passwordTxt" />
            <SignInButton />
            {valueReturn && <p>{valueReturn}</p>}
        </form>
    );
}

function SignInButton() {
    const { pending } = useFormStatus();
    return (
        <button aria-disabled={pending} type="submit">
            Sign in
        </button>
    );
}
