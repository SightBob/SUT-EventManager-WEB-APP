'use client'
import React, { useState, useEffect } from 'react';
import { Calendar } from "@nextui-org/calendar";
import { parseDate, today } from "@internationalized/date";
import axios from 'axios';

const CalendarComponent = ({ onDateChange, selectedDate }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // แปลง Date เป็น parsedDate
  const parsedSelectedDate = selectedDate 
    ? parseDate(
        selectedDate.getFullYear() + "-" + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + 
        String(selectedDate.getDate()).padStart(2, '0')
      )
    : null;

  // ดึงข้อมูลกิจกรรมทั้งหมด
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/post');
        // กรองเฉพาะโพสต์ที่ได้รับการอนุมัติ
        const approvedEvents = response.data.getAllPost.filter(event => event.status === 'approved');
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ฟังก์ชันตรวจสอบว่าวันที่มีกิจกรรมหรือไม่
  const isDateUnavailable = (date) => {
    if (!events.length) return false;

    // แปลงวันที่ที่ได้รับเป็นรูปแบบ YYYY-MM-DD
    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

    // ตรวจสอบว่ามีกิจกรรมที่ได้รับการอนุมัติในวันนี้หรือไม่
    return !events.some(event => event.start_date === formattedDate);
  };

  const handleDateChange = (date) => {
    const fullDate = new Date(
      date.year, 
      date.month - 1,
      date.day
    );
    
    onDateChange(fullDate);
  }
 
  return (
    <div className={`p-4 mx-auto bg-white rounded-xl space-y-4 max-lg:w-[100%] max-sm:w-full max-w-[300px] flex flex-col items-center`}>
      <Calendar 
        aria-label="Date (Show Month and Year Picker)"
        value={parsedSelectedDate}
        onChange={handleDateChange}
        isDateUnavailable={isDateUnavailable}
        showMonthAndYearPickers
        className="border-none mx-auto"
        minValue={today()} // เพิ่มเพื่อไม่ให้เลือกวันที่ผ่านมาแล้ว
        renderDayContent={(date) => {
          const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
          const eventsOnThisDay = events.filter(event => event.start_date === formattedDate);
          
          return (
            <div className="relative w-full h-full">
              <span>{date.day}</span>
              {eventsOnThisDay.length > 0 && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default CalendarComponent;
