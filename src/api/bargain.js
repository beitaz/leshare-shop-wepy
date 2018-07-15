import base from './base';
import api from './group';
import wepy from 'wepy';
import order from './order'
import Page from '../utils/Page';

export default class group extends base {
  /***
   * 根据拼团商品规则ID查找拼团信息(商品)
   */
  static rule(ruleId) {
    let url = `${this.baseUrl}/goods_bargain/rules/${ruleId}`;
    return this.get(url).then(data => api._processGoodsDetail(data));
  }

  /***
   * 开砍/帮砍
   */
  static GoodsBargain(ruleId, id, sku) {
    let url = `${this.baseUrl}/goods_bargain`;
    let param = { ruleId: ruleId, id: id, sku: sku };
    return this.post(url, param)
  }
  /***
   * 根据砍价ID查找砍价详情
   */
  static bargain(bargainId) {
    let url = `${this.baseUrl}/goods_bargain/${bargainId}`;
    return this.get(url).then(data => this._processBargainGoods(data));
  }

  /***
   * 砍价完成下单
   */
  static order(trade, address) {
    let url = `${this.baseUrl}/goods_bargain/order`;
    order._processOrderAddress(trade, address);
    let param = { ruleId: trade.ruleId, order: trade, id: trade.id };
    return this.post(url, param);
  }

  /**
   * 返回参团列表
   */
  static list(status) {
    let url = `${this.baseUrl}/goods_bargain/rules?status=${status}`;
    return new Page(url, item => {
      this._processBargainListItem(item);
    });
  }
  // 处理方法

  static _processBargainGoods(data) {
    api._processGoodsPreview(data.rule); // 处理预览图
    this._processDetail(data); // 筛选规格
    this._processBargainUser(data); // 筛选开砍者
    this._processPrice(data); // 处理价格
    return data;
  }

  static _processBargainListItem(data) {
    api._processGoodsPreview(data.rule); // 处理预览图
    data.rule.skuDetail = data.rule.skuDetails.find(item => item.sku === data.sku); // 筛选规格
    this._processPrice(data); // 处理价格
  }

  // 处理详情信息
  static _processDetail(data) {
    data.rule.skuDetail = data.rule.skuDetails.find(item => item.sku === data.sku);
    if (!data.createTime) return;
    data.createTime = data.createTime.replace(/-/g, '/');
  }

  // 处理砍价用户
  static _processBargainUser(data) {
    let { id: userId } = wepy.getStorageSync('user');
    let details = data.details;
    data.header = details[0]; // 处理发起者
    data.isHead = userId === data.header.customer.id; // 是否为发起人
    let self = details.find(item => item.customer.id === userId);
    data.isHelp = self != null; // 是否已经砍价
    // 自己砍了多少钱
    console.info(`[bargain] userId=${userId}, self=`);
    if (data.isHelp) data.reducePrice = self.reducePrice;
  }

  // 处理砍价价格
  static _processPrice(data) {
    data.allPrice = (data.details.reduce((prev, current) => prev + current.reducePrice, 0)).toFixed(2); // 一共砍了多少钱
    let goodsPrice = data.rule.skuDetail.price;
    data.balance = (goodsPrice * 1 - data.allPrice * 1).toFixed(2); // 剩余多少钱
    data.bargainRate = (data.balance / goodsPrice) * 100; // 砍价的百分比
    data.isFloor = data.balance === data.rule.floorPrice; // 是否已至底价
  }
}
