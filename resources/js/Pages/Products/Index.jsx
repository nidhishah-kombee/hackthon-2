import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

export default function Index({ products, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.category_id || '');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const { data, setData, post, put, delete: destroy, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        price: '',
        category_id: ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('products.index'), { search, category_id: filterCategory }, { preserveState: true });
    };

    const openModal = (product = null) => {
        clearErrors();
        if (product) {
            setEditingProduct(product);
            setData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                category_id: product.category_id
            });
        } else {
            setEditingProduct(null);
            reset();
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditingProduct(null);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingProduct) {
            put(route('products.update', editingProduct.id), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('products.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            destroy(route('products.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Products</h2>}
        >
            <Head title="Products" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="flex justify-between items-center mb-6">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <TextInput
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full"
                                />
                                <select 
                                    className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <PrimaryButton type="submit">Search</PrimaryButton>
                            </form>
                            <PrimaryButton onClick={() => openModal()}>Add Product</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {products.data.map(product => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.category?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${product.price}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">Edit</button>
                                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.data.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No products found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-wrap justify-between items-center sm:px-6">
                            <div className="flex gap-1">
                                {products.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 border text-sm ${link.active ? 'bg-indigo-50 text-indigo-600 border-indigo-500 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        {editingProduct ? 'Edit Product' : 'Add Product'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="category_id" value="Category" />
                        <select
                            id="category_id"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.category_id && <div className="text-red-500 text-sm mt-1">{errors.category_id}</div>}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="price" value="Price" />
                        <TextInput
                            id="price"
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            required
                        />
                        {errors.price && <div className="text-red-500 text-sm mt-1">{errors.price}</div>}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="description" value="Description" />
                        <textarea
                            id="description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <DangerButton onClick={closeModal} className="mr-3" type="button">Cancel</DangerButton>
                        <PrimaryButton type="submit">{editingProduct ? 'Update' : 'Create'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
