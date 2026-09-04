"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContactRequest } from "@/lib/actions/public";
import { contactRequestSchema } from "@/lib/validations";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { CONTACT_REQUEST_TYPES } from "@/constants";

type FormValues = z.input<typeof contactRequestSchema>;

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactRequest, {});
  const {
    register,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contactRequestSchema) as never,
  });

  if (state.success) {
    return (
      <div className="text-center py-10">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Message Sent</h3>
        <p className="text-muted-foreground">{state.message}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
          {state.error}
        </div>
      )}

      <FormInput
        label="Full Name"
        name="name"
        register={register("name")}
        error={errors.name?.message}
        placeholder="Your name"
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <FormInput
          label="Phone"
          name="phone"
          register={register("phone")}
          error={errors.phone?.message}
          placeholder="01XXXXXXXXX"
        />
        <FormInput
          label="Email"
          name="email"
          register={register("email")}
          error={errors.email?.message}
          placeholder="you@example.com"
          type="email"
        />
      </div>

      <FormSelect
        label="Request Type"
        name="request_type"
        value={undefined}
        onValueChange={(v) => setValue("request_type", v as FormValues["request_type"])}
        options={CONTACT_REQUEST_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        placeholder="Select request type"
        required
      />
      <input type="hidden" {...register("request_type")} />

      <FormInput
        label="Subject"
        name="subject"
        register={register("subject")}
        placeholder="Subject (optional)"
      />

      <FormTextarea
        label="Message"
        name="message"
        register={register("message")}
        error={errors.message?.message}
        placeholder="Write your message here..."
        rows={5}
        required
      />

      <Button type="submit" disabled={pending} className="w-full h-12 text-base" size="lg">
        {pending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
