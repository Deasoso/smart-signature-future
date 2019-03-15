import { eos, currentEOSAccount as currentAccount } from './scatter';

const publishOnChain = async ({ hash = '' }) => {
  if (currentAccount() == null) {
    alert('请先登录');
    throw new Error('NOT-LOGINED');
  }
  return eos().transaction({
    actions: [
      {
        account: 'signature.bp',
        name: 'publish',
        authorization: [{
          actor: currentAccount().name,
          permission: currentAccount().authority,
        }],
        data: {
          sign:
          {
            author: currentAccount().name,
            fission_factor: 2000,
            id: 0, /* 一定會被覆蓋 */
            ipfs_hash: hash,
            /* 下面兩個需要一個預設值 */
            public_key: 'EOS5P9HXdVTcAVMph4ZppDKBMkBuT6ihnkLqTUrVFBtGR94cPjykJ',
            signature: 'SIG_K1_KZU9PyXP8YAePjCfCcmBjGHARkvTVDjKpKvVgS6XL8o2FXTXUdhP3rqrL38dJYgJo2WNBdYubsY9LKTo47RUUE4N3ZHjZQ',
          },
        },
      },
    ],
  });
};

const claim = () => {
  if (currentAccount() == null) { throw new Error('NOT-LOGINED'); }

  return eos().transaction({
    actions: [
      {
        account: 'signature.bp',
        name: 'claim',
        authorization: [{
          actor: currentAccount().name,
          permission: currentAccount().authority,
        }],
        data: {
          from: currentAccount().name,
        },
      },
    ],
  });
};

function transferEOS({ amount = 0, memo = '' }) {
  if (currentAccount() == null) { throw new Error('NOT-LOGINED'); }

  eos().transaction({
    actions: [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: currentAccount().name,
          permission: currentAccount().authority,
        }],
        data: {
          from: currentAccount().name,
          to: 'signature.bp',
          quantity: `${(amount).toFixed(4).toString()} EOS`,
          memo,
        },
      },
    ],
  }).then((result) => {
    alert('publish success!');
  }).catch((error) => {
    alert(`error:${JSON.stringify(error)}`);
  });
}

async function support({ amount = null, hash = null, share_id = null }) {
  if (currentAccount() == null) {
    alert('请先登录');
    return;
  }
  const contract = await eos().contract('signature.bp');
  const sign = await contract.getSignbyhash(hash);
  
  await contract.support({
    amount,
    sign_id: sign.id,
    share_id,
  });
}

async function getSignbyhash({ hash = null }) {
  if (hash == null) {
    alert('hash cant be null');
    return;
  }
  const resp = await eos().get_table_rows({
    json: true,
    code: 'signature.bp',
    scope: 'signature.bp',
    table: 'signs',
    table_key: 'hash',
    lower_bound: hash,
    limit: 1,
  });
  console.log(resp.rows);
  return resp;
}

async function getSharesInfo() {
  const { rows } = await eos().getTableRows({
    json: true,
    code: 'signature.bp',
    scope: 'signature.bp',
    table: 'shares',
    limit: 10000,
  });
  return rows;
}

async function getSignsInfo() {
  const { rows } = await eos().getTableRows({
    json: true,
    code: 'signature.bp',
    scope: 'signature.bp',
    table: 'signs',
    limit: 10000,
  });
  return rows;
}

async function getGoods() {
  const { rows } = await eos().getTableRows({
    json: true,
    code: 'signature.bp',
    scope: 'signature.bp',
    table: 'goods',
    limit: 10000,
  });
  return rows;
}

async function getPlayerIncome(name) {
  const { rows } = await eos().getTableRows({
    json: true,
    code: 'signature.bp',
    scope: name,
    table: 'players',
    limit: 10000,
  });
  return rows;
}

async function getMaxShareId() {
  const rows = await getSharesInfo();
  const len = rows.length;

  return len - 1;
}

async function getMaxSignId() {
  const rows = await getSignsInfo();
  const len = rows.length;
  let maxId = 0;

  for (let i = 0; i < len; i++) {
    for (obj in rows[i]) {
      if (obj.id > maxId) {
        maxId = obj.id;
      }
    }
  }
  return maxId;
}

async function withdraw() {
  if (currentAccount() == null) {
    alert('请先登录');
    return;
  }
  const contract = await eos().contract('signature.bp');
  await contract.claim(
    currentAccount().name,
    {
      authorization: [`${currentAccount().name}@${currentAccount().authority}`],
    },
  );
}

export {
  publishOnChain, claim, transferEOS, support, getSignbyhash, withdraw, getMaxShareId, getMaxSignId, getPlayerIncome, getGoods,
};