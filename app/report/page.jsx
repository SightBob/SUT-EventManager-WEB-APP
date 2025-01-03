"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reportResponse = await axios.get('/api/report'); // Your API endpoint
                console.log('Reports fetched:', reportResponse.data.reports);
                if (reportResponse.data.success) {
                    setReports(reportResponse.data.reports);
                } else {
                    console.error('Error fetching reports:', reportResponse.data.message);
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };
        fetchReports();
    }, []);

    const handleDeleteReport = async (reportId) => {
        if (confirm('คุณแน่ใจว่าต้องการลบรายงานและโพสต์นี้?')) {
            try {
                const response = await axios.delete('/api/report', { data: { reportId } });
                if (response.data.success) {
                    setReports(prevReports => prevReports.filter(report => report._id !== reportId));
                    alert('ลบรายงานและโพสต์สำเร็จ');
                } else {
                    alert('เกิดข้อผิดพลาดในการลบรายงานและโพสต์');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                alert('เกิดข้อผิดพลาดในการลบรายงานและโพสต์');
            }
        }
    };
    


    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    return (
        <div className="container mx-auto my-8 px-4">
            <h3 className="text-xl md:text-2xl font-semibold mb-4">การรายงานโพสต์</h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">ID โพสต์</th>
                                <th className="px-4 py-2">ผู้ใช้ที่รายงาน</th>
                                <th className="px-4 py-2">เหตุผลในการรายงาน</th>
                                <th className="px-4 py-2">เวลาที่รายงาน</th>
                                <th className="px-4 py-2">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(reports) && reports.map(report => {
                                const user = Array.isArray(users) ? users.find(user => user._id.toString() === report.reportedBy) : null;

                                return (
                                    <tr key={report._id} className="text-center border-b">
                                        <td className="px-4 py-2">{report.postId}</td>
                                        <td className="px-4 py-2">{ report.reportedBy.username ? report.reportedBy.username : 'Unknown User'}</td>
                                        <td className="px-4 py-2">{truncateText(report.reason, 50)}</td>
                                        <td className="px-4 py-2">{new Date(report.reportedAt).toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            <button className="bg-green-500 text-white px-2 py-1 rounded-lg" onClick={() => {
                                                router.push(`/page/${report.postId}`); // Redirect to post detail
                                            }}>
                                                View
                                            </button>
                                            <button className="bg-red-500 text-white px-2 py-1 rounded-lg ml-2"  onClick={() => handleDeleteReport(report._id)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
