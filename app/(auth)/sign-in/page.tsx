import Image from "next/image"
import { GalleryVerticalEnd } from "lucide-react"
import SignInForm from "./components/signin-form"

export default function SignInPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md ">
              <Image
                src="/images/logo-admin.png"
                alt="logo"
                width={42}
                height={42}
                className="size-6!"
              />
            </div>
            PIGIER-BENIN
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/images/placeholder.png"
          alt="Image"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
