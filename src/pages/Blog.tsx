import React from 'react';

export default function Blog() {
  const posts = [
    {
      title: "Guide des paris sportifs pour débutants",
      excerpt: "Découvrez les bases des paris sportifs et apprenez à parier de manière responsable.",
      date: "2024-02-20",
      readTime: "5 min"
    },
    {
      title: "Les meilleures stratégies de paris",
      excerpt: "Explorez les stratégies éprouvées pour optimiser vos chances de gains.",
      date: "2024-02-18",
      readTime: "8 min"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog</h1>
        <div className="space-y-6">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <time>{post.date}</time>
                <span>•</span>
                <span>{post.readTime} de lecture</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <button className="text-blue-600 font-medium hover:text-blue-700">
                Lire la suite →
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}