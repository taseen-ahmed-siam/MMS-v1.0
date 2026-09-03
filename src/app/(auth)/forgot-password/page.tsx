"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Landmark,
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  resetPasswordAction,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = { error: null };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  );

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary islamic-pattern-dark relative items-center justify-center p-12">
        <div className="relative z-10 text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Landmark className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Al-Noor Mosque</h1>
          <p className="text-lg text-white/80 max-w-sm mx-auto">
            We&apos;ll help you get back in
          </p>
          <div className="mt-12 ornamental-separator text-white/60">
            <span className="text-accent text-2xl">&#9830;</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/50 to-primary/80" />
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Al-Noor Mosque</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          {state.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state.success ? (
            <div className="rounded-lg border border-success/50 bg-success/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                Recovery link sent
              </h3>
              <p className="text-sm text-muted-foreground">
                If an account exists with this email, a recovery link has been
                sent.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send recovery link"
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
