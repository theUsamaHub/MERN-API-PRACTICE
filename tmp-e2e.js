const BASE = process.env.BASE || 'http://localhost:5099';

let passed = 0;
let failed = 0;

const check = (label, cond, extra = '') => {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${label} ${extra}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${label} ${extra}`);
  }
};

const call = async (method, path, { json, form } = {}) => {
  const opts = { method };
  if (json !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = typeof json === 'string' ? json : JSON.stringify(json);
  }
  if (form) opts.body = form;
  const res = await fetch(`${BASE}${path}`, opts);
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, body };
};

(async () => {
  // 1. create category
  let r = await call('POST', '/api/categories', {
    json: { name: 'Books', description: 'Printed books' },
  });
  check('create category', r.status === 201 && r.body.data.name === 'Books', `-> ${r.status}`);
  const catId = r.body?.data?._id;

  // 2. duplicate name (case-insensitive)
  r = await call('POST', '/api/categories', { json: { name: 'books' } });
  check('duplicate category rejected', r.status === 409, `-> ${r.status}`);

  // 3. missing name
  r = await call('POST', '/api/categories', { json: { description: 'x' } });
  check('category without name -> 400', r.status === 400, `-> ${r.status}`);

  // 4. malformed JSON
  r = await call('POST', '/api/categories', { json: '{name:"broken"' });
  check('malformed JSON -> 400', r.status === 400, `-> ${r.status}`);

  // 5. categories list includes migrated legacy category + productCount
  r = await call('GET', '/api/categories');
  const names = (r.body.data || []).map((c) => c.name);
  check(
    'list categories (migrated + count)',
    r.status === 200 && names.includes('Electronics') &&
      r.body.data.find((c) => c.name === 'Electronics').productCount === 1,
    `-> [${names.join(', ')}]`
  );

  // 6. create product with category (JSON body)
  r = await call('POST', '/api/products', {
    json: { name: 'Clean Code', price: 30, stock: 5, category: catId },
  });
  check(
    'create product with category (JSON)',
    r.status === 201 && r.body.data.category?._id === catId,
    `-> ${r.status} category=${r.body?.data?.category?.name}`
  );
  const prodId = r.body?.data?._id;

  // 7. create product multipart (form-data, like Postman)
  const fd = new FormData();
  fd.append('name', 'Refactoring');
  fd.append('price', '25');
  fd.append('category', catId);
  r = await call('POST', '/api/products', { form: fd });
  check(
    'create product with category (multipart)',
    r.status === 201 && r.body.data.category?.name === 'Books',
    `-> ${r.status}`
  );
  const prod2Id = r.body?.data?._id;

  // 8. bogus category id
  r = await call('POST', '/api/products', {
    json: { name: 'Bad', price: 1, category: 'notanid' },
  });
  check('bogus category id -> 400', r.status === 400, `-> ${r.status}`);

  // 9. unknown but valid category id
  r = await call('POST', '/api/products', {
    json: { name: 'Bad2', price: 1, category: '6ac100000000000000000000' },
  });
  check('unknown category id -> 400', r.status === 400, `-> ${r.status}`);

  // 10. filter by category
  r = await call('GET', `/api/products?category=${catId}`);
  check(
    'filter products by category',
    r.status === 200 && r.body.count === 2,
    `-> ${r.status} count=${r.body?.count}`
  );

  // 11. invalid filter id
  r = await call('GET', '/api/products?category=oops');
  check('invalid filter id -> 400', r.status === 400, `-> ${r.status}`);

  // 12. rename category -> product follows
  r = await call('PUT', `/api/categories/${catId}`, {
    json: { name: 'Books & Media' },
  });
  check('rename category', r.status === 200 && r.body.data.name === 'Books & Media', `-> ${r.status}`);
  r = await call('GET', `/api/products/${prodId}`);
  check(
    'rename propagates to product',
    r.body.data.category?.name === 'Books & Media',
    `-> ${r.body?.data?.category?.name}`
  );

  // 13. delete category still in use
  r = await call('DELETE', `/api/categories/${catId}`);
  check('delete used category -> 409', r.status === 409, `-> ${r.status}`);

  // 14. empty name on update
  r = await call('PUT', `/api/categories/${catId}`, { json: { name: '   ' } });
  check('empty name update -> 400', r.status === 400, `-> ${r.status}`);

  // 15. delete products, then category
  r = await call('DELETE', `/api/products/${prodId}`);
  check('delete product', r.status === 200, `-> ${r.status}`);
  r = await call('DELETE', `/api/products/${prod2Id}`);
  check('delete product 2', r.status === 200, `-> ${r.status}`);
  r = await call('DELETE', `/api/categories/${catId}`);
  check('delete now-free category', r.status === 200, `-> ${r.status}`);

  // 16. delete nonexistent category
  r = await call('DELETE', `/api/categories/${catId}`);
  check('delete missing category -> 404', r.status === 404, `-> ${r.status}`);

  // 17. legacy data still readable and populated
  r = await call('GET', '/api/products');
  const legacy = (r.body.data || []).find((p) => p.name.startsWith('Legacy Phone'));
  check(
    'legacy product category populated',
    !!legacy && legacy.category?.name === 'Electronics',
    `-> ${legacy?.category?.name}`
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('SCRIPT ERROR:', e);
  process.exit(1);
});
