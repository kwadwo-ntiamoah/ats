"use client"

import { getCustomerProfileAsync } from "@/lib/actions/profile"
import { useEffect, useState } from "react"

export function Greeting() {
    const [firstName, setFirstName] = useState<string>()

    useEffect(() => {
        getCustomerProfileAsync().then((response) => {
            if (response.success) setFirstName(response.firstName.trim())
        })
    }, [])

    return <>Welcome{firstName ? ` ${firstName}` : ""} 👋</>
}
