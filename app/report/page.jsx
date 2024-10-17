"use client"; // This marks the component as a Client Component

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Ensure correct import

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const router = useRouter(); // Initialize router

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reportResponse = await axios.get('/api/report'); // Your API endpoint
                console.log('Reports fetched:', reportResponse.data);
                if (reportResponse.data.success) {
                    setReports(reportResponse.data.reports);
                } else {
                    console.error('Error fetching reports:', reportResponse.data.message);
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const userResponse = await axios.get('/api/getUsers');
                console.log('Users fetched:', userResponse.data);
                setUsers(userResponse.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchReports();
        fetchUsers();
    }, []);

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
                                        <td className="px-4 py-2">{user ? user.username : 'Unknown User'}</td>
                                        <td className="px-4 py-2">{truncateText(report.reason, 50)}</td>
                                        <td className="px-4 py-2">{new Date(report.reportedAt).toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            <button className="bg-green-500 text-white px-2 py-1 rounded-lg" onClick={() => {
                                                router.push(`/page/${report.postId}`); // Redirect to post detail
                                            }}>
                                                View
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
