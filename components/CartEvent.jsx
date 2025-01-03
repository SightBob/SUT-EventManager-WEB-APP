'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from "next/image";
import Link from "next/link";
import { Card, CardBody, CardFooter, Button, Chip } from "@nextui-org/react";
import { toast, Toaster } from 'react-hot-toast';

const CartEvent = ({ 
 id, 
 img, 
 title, 
 start_date, 
 start_time, 
 location, 
 type="",  
 member="", 
 maxParticipants="", 
 current_participants="", 
 userId="", 
 favorites=[], 
 onFavoriteToggle, 
 onDelete, 
 views=0,
 status=""
}) => {
 const [isFavorited, setIsFavorited] = useState(favorites.includes(userId));
  const toggleFavorite = async () => {
   setIsFavorited(!isFavorited); 
 
   try {
     const response = await axios.post('/api/favorite', {
       postId: id,
       userId 
     });
 
     toast.success(isFavorited ? 'นำออกจากรายการโปรดแล้ว' : 'เพิ่มในรายการโปรดแล้ว');
 
     if (onFavoriteToggle) {
       onFavoriteToggle();
     }
   } catch (error) {
     console.error("Error toggling favorite:", error);
     setIsFavorited(isFavorited);
     toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
   }
 };
  useEffect(() => {
   setIsFavorited(favorites.includes(userId)); 
 }, [favorites, userId]);
 
  const ClickDelete = async () => {
    try {
      const confirmed = await toast((t) => (
        <div className="flex flex-col gap-3">
          <div className="text-lg font-medium">คุณต้องการลบโพสต์นี้ใช่หรือไม่?</div>
          <div className="flex gap-3">
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => {
                toast.dismiss(t.id);
                handleDelete();
              }}
            >
              ยืนยัน
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors" 
              onClick={() => toast.dismiss(t.id)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center'
      });

      if (!confirmed) return;

    } catch (error) {
      console.error("Error in delete confirmation:", error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  const handleDelete = async () => {
    const loadingToast = toast.loading('กำลังลบโพสต์...');

    try {
      const res = await axios.delete(`/api/post?id=${id}`);
      
      if (res.status === 200) {
        toast.success('ลบโพสต์สำเร็จ', { id: loadingToast });
        if (onDelete) {
          onDelete(id);
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error('เกิดข้อผิดพลาดในการลบโพสต์', { id: loadingToast });
    }
  }
  return (
   <>
     <Toaster 
       position="top-right"
       toastOptions={{
         duration: 3000,
         style: {
           background: '#333',
           color: '#fff',
         },
         success: {
           style: {
             background: 'green',
           },
         },
         error: {
           style: {
             background: 'red',
           },
         },
       }}
     />
     <Card className="max-h-[410px] w-full relative">
       {type === "edit" ? (
         <Button
           isIconOnly
           color="danger"
           aria-label="Delete"
           className="absolute top-2 right-2 z-10"
           onClick={ClickDelete}
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
           </svg>
         </Button>
       ) : (
         userId !== "" && (
           <Button
             isIconOnly
             variant="solid"
             className="absolute top-2 right-2 z-10"
             onClick={toggleFavorite}
           >
             <svg
               xmlns="http://www.w3.org/2000/svg"
               fill={isFavorited ? "#F64F72" : "none"} 
               stroke="currentColor"
               strokeWidth="1.5"
               className="size-5 text-[#F64F72]"
               viewBox="0 0 24 24"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
               />
             </svg>
           </Button>
         )
       )}
        <CardBody className="p-0">
         <div className="relative w-full h-[250px] max-[440px]:h-[200px]">
           <Image
             className="object-cover rounded-t-lg cursor-pointer"
             fill
             style={{ objectFit: "cover" }}
             alt="image event"
             src={img ? img : "https://oreg.rmutt.ac.th/wp-content/uploads/2019/01/40275-Converted-01.png"}
             onClick={() => {
               if (type === "edit" && (status === 'approved' || status === 'revision')) {
                 window.location.href = `/editEvent/${id}`;
               } else {
                 window.location.href = `/page/${id}`;
               }
             }}
           />
         </div>
         <div className="p-4">
           <div className="text-[#FF6600]">
             <h3 className="line-clamp-1 text-2xl max-[1521px]:text-xl w-full font-semibold" >
             <Link 
               href={type === "edit" && (status === 'approved' || status === 'revision') ? `/editEvent/${id}` : `/page/${id}`} 
               className="hover:underline"
             >
                {title ? title : "เปิดโลกชวนชมรมเปิดบูธกิจกรรม"}
             </Link>
             </h3>
             <h5 className="line-clamp-1 text-lg max-[1521px]:text-lg">
               {start_date ? start_date : "วันที่ 17-26 กรกฏาคม 2567"} เวลา{" "}
               {start_time ? start_time : "12.00 -13.00"}
             </h5>
             <p className="line-clamp-1 text-sm">
               {location ? location : "สถานที่ ลานอเนกประสงค์ อาคารเรียวรวม1"}
             </p>
           </div>
         </div>
       </CardBody>
        <CardFooter className="flex justify-between items-center px-4 pb-4">
         {type === "edit" ? (
           <div className="flex items-center gap-2">
             {(status === 'approved' || status === 'revision') && (
               <Button
                 as={Link}
                 href={`/editEvent/${id}`}
                 color="default"
                 variant="flat"
               >
                 แก้ไข
               </Button>
             )}
             {member === "yes" && (
               <Button
                 as={Link}
                 href={`/viewMember/${id}`}
                 color="default"
                 variant="flat"
                 startContent={
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                   </svg>
                 }
               >
                 {current_participants} / {maxParticipants}
               </Button>
             )}
           </div>
         ) : (
           <Button
             as={Link}
             href={`/page/${id}`}
             color="default"
             variant="flat"
           >
             รายละเอียด
           </Button>
         )}
         
         <Chip
           variant="flat"
           startContent={
             <svg
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               stroke="currentColor"
               strokeWidth="1.5"
               className="size-5"
               viewBox="0 0 24 24"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
               />
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
               />
             </svg>
           }
         >
           {views}
         </Chip>
       </CardFooter>
     </Card>
   </>
 );
};
export default CartEvent;