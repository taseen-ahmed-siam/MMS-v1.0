"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Landmark, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
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
            Join our community and stay connected
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
              Create an account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill in the details below to get started
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
                Check your email
              </h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a confirmation link to your email address. Please
                verify your account to continue.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="full_name"
                  className="text-sm font-medium text-foreground"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Create a strong password"
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
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          )}

          {!state.success && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
