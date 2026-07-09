"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { fetchAuthUser, insertAccessLog } from "@/lib/supabase"

export type UserRole = "admin" | "staff"

export interface User {
  id: string
  username: string
  displayName: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  logAction: (action: string, details: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const SESSION_KEY = "lap68_session"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      localStorage.removeItem(SESSION_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const authUser = await fetchAuthUser(username.trim(), password)
      if (!authUser) {
        return { success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" }
      }

      const sessionUser: User = {
        id: authUser.id,
        username: authUser.username,
        displayName: authUser.display_name,
        role: authUser.role,
      }

      setUser(sessionUser)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))

      await insertAccessLog({
        user_id: sessionUser.id,
        username: sessionUser.username,
        display_name: sessionUser.displayName,
        action: "Đăng nhập",
        module: "cashflow",
        details: "Đăng nhập hệ thống",
        ip_address: "",
      })

      return { success: true }
    } catch {
      return { success: false, error: "Không thể kết nối máy chủ" }
    }
  }

  const logout = () => {
    if (user) {
      insertAccessLog({
        user_id: user.id,
        username: user.username,
        display_name: user.displayName,
        action: "Đăng xuất",
        module: "cashflow",
        details: "Đăng xuất hệ thống",
        ip_address: "",
      }).catch(() => {})
    }
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const logAction = (action: string, details: string) => {
    if (!user) return
    insertAccessLog({
      user_id: user.id,
      username: user.username,
      display_name: user.displayName,
      action,
      module: "cashflow",
      details,
      ip_address: "",
    }).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, logAction }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
