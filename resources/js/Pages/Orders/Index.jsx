import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function Index({ orders, products, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    const { data, setData, post, put, delete: destroy, errors, reset, clearErrors } = useForm({
        product_id: '',
        quantity: 1,
        status: 'pending',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('orders.index'), { search, status: filterStatus }, { preserveState: true });
    };

    const openCreate = () => {
        clearErrors();
        setEditingOrder(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (order) => {
        clearErrors();
        setEditingOrder(order);
        setData({ product_id: order.product_id, quantity: order.quantity, status: order.status });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditingOrder(null);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingOrder) {
            put(route('orders.update', editingOrder.id), { onSuccess: closeModal });
        } else {
            post(route('orders.store'), { onSuccess: closeModal });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this order?')) destroy(route('orders.destroy', id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Orders</h2>}
        >
            <Head title="Orders" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">

                        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                            <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
                                <TextInput
                                    type="text"
                                    placeholder="Search by product..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <select
                                    className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 rounded-md shadow-sm"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <PrimaryButton type="submit">Search</PrimaryButton>
                            </form>
                            <PrimaryButton onClick={openCreate}>New Order</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        {['ID', 'Product', 'Qty', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {orders.data.map(order => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{order.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{order.product?.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{order.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">${order.total_price}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button onClick={() => openEdit(order)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 mr-4">Edit</button>
                                                <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900 dark:text-red-400">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.data.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-between items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {orders.from ?? 0} to {orders.to ?? 0} of {orders.total} entries
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {orders.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 border text-sm ${link.active ? 'bg-indigo-50 text-indigo-600 border-indigo-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {editingOrder ? 'Edit Order' : 'New Order'}
                    </h2>

                    {!editingOrder && (
                        <>
                            <div className="mt-6">
                                <InputLabel htmlFor="product_id" value="Product" />
                                <select
                                    id="product_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 rounded-md shadow-sm"
                                    value={data.product_id}
                                    onChange={(e) => setData('product_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
                                    ))}
                                </select>
                                {errors.product_id && <div className="text-red-500 text-sm mt-1">{errors.product_id}</div>}
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="quantity" value="Quantity" />
                                <TextInput
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="mt-1 block w-full"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    required
                                />
                                {errors.quantity && <div className="text-red-500 text-sm mt-1">{errors.quantity}</div>}
                            </div>
                        </>
                    )}

                    {editingOrder && (
                        <div className="mt-6">
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 rounded-md shadow-sm"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <DangerButton onClick={closeModal} type="button" className="mr-3">Cancel</DangerButton>
                        <PrimaryButton type="submit">{editingOrder ? 'Update' : 'Place Order'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
